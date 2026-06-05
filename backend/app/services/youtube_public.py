from googleapiclient.discovery import build
from typing import Dict, Any, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
import re

class YouTubePublicService:
    """
    Fetches public YouTube data using just an API key (no OAuth required).
    This enables importing any channel by URL without user authentication.
    """
    def __init__(self):
        if not settings.YOUTUBE_API_KEY:
            raise ValueError("YOUTUBE_API_KEY is not set in environment variables.")
        self.youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)

    def resolve_channel_identifier(self, input_str: str) -> str:
        """
        Resolves a YouTube URL, handle (@name), or raw channel ID into a channel ID.
        Supports:
          - https://youtube.com/@handle
          - https://youtube.com/channel/UCxxxxxx
          - @handle
          - UCxxxxxx (raw ID)
        """
        input_str = input_str.strip()

        # Raw channel ID
        if input_str.startswith("UC") and len(input_str) == 24:
            return input_str

        # Extract handle from URL or direct @handle
        handle_match = re.search(r'@([\w\-\.]+)', input_str)
        if handle_match:
            handle = handle_match.group(1)
            return self._resolve_handle(handle)

        # Extract channel ID from URL
        channel_id_match = re.search(r'channel/(UC[\w\-]{22})', input_str)
        if channel_id_match:
            return channel_id_match.group(1)

        # Try as a search query (channel name)
        return self._search_channel(input_str)

    def _resolve_handle(self, handle: str) -> str:
        request = self.youtube.channels().list(
            part="id",
            forHandle=handle
        )
        response = request.execute()
        if not response.get("items"):
            raise ValueError(f"No channel found for handle @{handle}")
        return response["items"][0]["id"]

    def _search_channel(self, query: str) -> str:
        request = self.youtube.search().list(
            part="snippet",
            q=query,
            type="channel",
            maxResults=1
        )
        response = request.execute()
        if not response.get("items"):
            raise ValueError(f"No channel found for query: {query}")
        return response["items"][0]["snippet"]["channelId"]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_channel_info(self, channel_id: str) -> Dict[str, Any]:
        request = self.youtube.channels().list(
            part="snippet,statistics",
            id=channel_id
        )
        response = request.execute()
        if not response.get("items"):
            raise ValueError(f"No channel found with ID: {channel_id}")

        ch = response["items"][0]
        return {
            "youtube_channel_id": ch["id"],
            "title": ch["snippet"]["title"],
            "description": ch["snippet"].get("description", ""),
            "thumbnail_url": ch["snippet"]["thumbnails"]["high"]["url"],
            "country": ch["snippet"].get("country"),
            "subscriber_count": int(ch["statistics"].get("subscriberCount", 0)),
            "view_count": int(ch["statistics"].get("viewCount", 0)),
            "video_count": int(ch["statistics"].get("videoCount", 0)),
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_recent_videos(self, channel_id: str, max_results: int = 30) -> List[Dict[str, Any]]:
        # First get the uploads playlist ID
        ch_request = self.youtube.channels().list(
            part="contentDetails",
            id=channel_id
        )
        ch_response = ch_request.execute()
        if not ch_response.get("items"):
            return []

        uploads_playlist_id = ch_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        # Fetch video IDs from the uploads playlist
        pl_request = self.youtube.playlistItems().list(
            part="contentDetails",
            playlistId=uploads_playlist_id,
            maxResults=min(max_results, 50)
        )
        pl_response = pl_request.execute()
        video_ids = [item["contentDetails"]["videoId"] for item in pl_response.get("items", [])]

        if not video_ids:
            return []

        # Fetch detailed video info in batches of 50
        videos = []
        for i in range(0, len(video_ids), 50):
            batch = video_ids[i:i+50]
            v_request = self.youtube.videos().list(
                part="snippet,statistics,contentDetails",
                id=",".join(batch)
            )
            v_response = v_request.execute()
            for v in v_response.get("items", []):
                videos.append({
                    "youtube_video_id": v["id"],
                    "title": v["snippet"]["title"],
                    "description": v["snippet"].get("description", ""),
                    "tags": v["snippet"].get("tags", []),
                    "thumbnail_url": v["snippet"]["thumbnails"]["high"]["url"],
                    "duration": v["contentDetails"]["duration"],
                    "published_at": v["snippet"]["publishedAt"],
                    "view_count": int(v["statistics"].get("viewCount", 0)),
                    "like_count": int(v["statistics"].get("likeCount", 0)),
                    "comment_count": int(v["statistics"].get("commentCount", 0)),
                })
        return videos

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_video_comments(self, video_id: str, max_results: int = 100) -> List[Dict[str, Any]]:
        comments = []
        try:
            request = self.youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(max_results, 100),
                textFormat="plainText",
                order="relevance"
            )
            response = request.execute()

            for item in response.get("items", []):
                comment = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "youtube_comment_id": item["snippet"]["topLevelComment"]["id"],
                    "text": comment["textDisplay"],
                    "author": comment["authorDisplayName"],
                    "like_count": int(comment.get("likeCount", 0)),
                    "published_at": comment["publishedAt"],
                })
        except Exception as e:
            # Comments might be disabled on this video
            print(f"Could not fetch comments for {video_id}: {e}")
        return comments
