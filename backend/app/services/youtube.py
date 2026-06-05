from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import Dict, Any, List
import datetime
from tenacity import retry, stop_after_attempt, wait_exponential

class YouTubeIntegrationService:
    def __init__(self, credentials_data: Dict[str, Any]):
        self.credentials = Credentials(
            token=credentials_data.get("token"),
            refresh_token=credentials_data.get("refresh_token"),
            token_uri=credentials_data.get("token_uri"),
            client_id=credentials_data.get("client_id"),
            client_secret=credentials_data.get("client_secret"),
            scopes=credentials_data.get("scopes")
        )
        self.youtube = build("youtube", "v3", credentials=self.credentials)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_channel_metadata(self) -> Dict[str, Any]:
        request = self.youtube.channels().list(
            part="snippet,statistics",
            mine=True
        )
        response = request.execute()
        if not response.get("items"):
            raise ValueError("No channel found for the authenticated user.")
        
        channel = response["items"][0]
        return {
            "youtube_channel_id": channel["id"],
            "title": channel["snippet"]["title"],
            "description": channel["snippet"]["description"],
            "country": channel["snippet"].get("country"),
            "subscriber_count": int(channel["statistics"].get("subscriberCount", 0)),
            "view_count": int(channel["statistics"].get("viewCount", 0)),
            "video_count": int(channel["statistics"].get("videoCount", 0)),
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_videos(self, channel_id: str, max_results: int = 50) -> List[Dict[str, Any]]:
        # For simplicity in MVP, we fetch recent videos using search endpoint
        # A more robust way is fetching from the channel's uploads playlist
        request = self.youtube.search().list(
            part="id,snippet",
            channelId=channel_id,
            maxResults=max_results,
            order="date",
            type="video"
        )
        response = request.execute()
        videos = []
        for item in response.get("items", []):
            video_id = item["id"]["videoId"]
            # Fetch detailed stats
            stats_request = self.youtube.videos().list(
                part="statistics,contentDetails,snippet",
                id=video_id
            )
            stats_response = stats_request.execute()
            if stats_response.get("items"):
                v = stats_response["items"][0]
                videos.append({
                    "youtube_video_id": video_id,
                    "title": v["snippet"]["title"],
                    "description": v["snippet"]["description"],
                    "tags": v["snippet"].get("tags", []),
                    "thumbnail_url": v["snippet"]["thumbnails"]["high"]["url"],
                    "duration": v["contentDetails"]["duration"], # ISO 8601 duration
                    "published_at": v["snippet"]["publishedAt"],
                    "view_count": int(v["statistics"].get("viewCount", 0)),
                    "like_count": int(v["statistics"].get("likeCount", 0)),
                    "comment_count": int(v["statistics"].get("commentCount", 0)),
                })
        return videos

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_comments(self, video_id: str, max_results: int = 100) -> List[Dict[str, Any]]:
        comments = []
        try:
            request = self.youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(max_results, 100),
                textFormat="plainText"
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
            # Comments might be disabled
            print(f"Error fetching comments for video {video_id}: {e}")
        return comments
