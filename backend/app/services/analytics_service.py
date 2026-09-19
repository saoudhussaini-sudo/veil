import logging
from typing import Dict, Any, List
from app.storage.database import (
    get_analytics_summary,
    get_recent_access_events,
    get_most_accessed_files,
    get_access_over_time
)

logger = logging.getLogger("veil.services.analytics")

class AnalyticsService:
    """
    Local privacy-preserving audit engine.
    Calculates offline data access metrics directly from SQLite.
    Zero network requests, zero telemetry sent outside the local device.
    """
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Returns high-level statistics for the Activity dashboard.
        """
        return get_analytics_summary()

    def get_recent_access(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Returns the most recent offline data access events.
        """
        return get_recent_access_events(limit=limit)

    def get_most_accessed(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Returns files ranked by number of local accesses.
        """
        return get_most_accessed_files(limit=limit)

    def get_access_trend(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Returns daily access event counts for the offline access chart.
        """
        return get_access_over_time(days=days)

analytics_service = AnalyticsService()
