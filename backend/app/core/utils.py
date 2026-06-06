import re

def parse_iso8601_duration(duration_str: str) -> int:
    """
    Parses an ISO 8601 duration string (e.g. "PT1H2M10S", "PT45S", "PT1M")
    into total seconds.
    """
    if not duration_str:
        return 0
    # Match standard format: P(days)D T(hours)H(minutes)M(seconds)S
    pattern = re.compile(
        r'P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?'
    )
    match = pattern.match(duration_str)
    if not match:
        return 0
    
    parts = match.groupdict()
    days = int(parts.get('days') or 0)
    hours = int(parts.get('hours') or 0)
    minutes = int(parts.get('minutes') or 0)
    seconds = int(parts.get('seconds') or 0)
    
    return days * 86400 + hours * 3600 + minutes * 60 + seconds
