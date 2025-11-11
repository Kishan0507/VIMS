# ...existing code...
import os
import logging
from typing import List, Dict, Optional
import requests
from django.conf import settings
from requests.exceptions import RequestException, Timeout

logger = logging.getLogger(__name__)


def _get_api_key() -> Optional[str]:
    return getattr(settings, "NEWS_API_KEY", None) or os.getenv("NEWS_API_KEY","YOUR_API_KEY")


def fetch_accident_news(limit: int = 10) -> List[Dict]:
    """
    Fetch recent news only about vehicle/car/road accidents and collisions.
    Returns a list of simplified article dicts. Empty list on error or when API key is missing.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning("NEWS_API_KEY not set; fetch_accident_news returning empty list.")
        return []

    url = "https://newsapi.org/v2/everything"
    # focused query for vehicle/car/road accidents and collisions
    query = (
        "vehicle crash OR car crash OR traffic accident OR road accident OR "
        "vehicle accident OR collision OR multi-vehicle crash"
    )
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": max(1, min(limit, 100)),
        "apiKey": api_key,
    }

    try:
        resp = requests.get(url, params=params, timeout=6)
        resp.raise_for_status()
        payload = resp.json()
        articles = payload.get("articles", []) if isinstance(payload, dict) else []
        results: List[Dict] = []
        for a in articles:
            results.append({
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "url": a.get("url", ""),
                "source": (a.get("source") or {}).get("name", ""),
                "publishedAt": a.get("publishedAt", ""),
                "image": a.get("urlToImage", ""),
            })
        return results
    except (RequestException, Timeout, ValueError) as exc:
        logger.error("Error fetching accident news: %s", exc)
        return []
