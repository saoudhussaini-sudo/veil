from fastapi import APIRouter
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Local Analytics & Offline Audit"])

@router.get("")
def get_analytics():
    """
    Returns local statistics for the Activity dashboard:
    - files_accessed
    - offline_queries
    - moss_retrievals
    - local_analyses
    - recent_access
    - most_accessed
    - access_over_time
    """
    return analytics_service.get_dashboard_summary()

@router.get("/recent")
def get_recent_access(limit: int = 20):
    """Returns chronological audit log of offline data access events."""
    return analytics_service.get_recent_access(limit=limit)

@router.get("/most-accessed")
def get_most_accessed(limit: int = 10):
    """Returns files ranked by number of local accesses."""
    return analytics_service.get_most_accessed(limit=limit)

@router.get("/trend")
def get_access_trend(days: int = 7):
    """Returns daily access event trend."""
    return analytics_service.get_access_trend(days=days)
