from fastapi import APIRouter, HTTPException
import os
from dependencies import check_enterprise_tier

router = APIRouter()

@router.get("/analytics")
async def get_analytics(user_id: str = None):
    try:
        await check_enterprise_tier(user_id)
        from services.supabase_client import supabase

        # 1. Fetch all tickets for aggregation
        # In a real enterprise app, we'd use SQL aggregations, but for MVP, 
        # we can fetch and process or use Supabase's count features.
        res = supabase.table("tickets").select("id, status, priority, type, urgency_score, created_at").execute()
        tickets = res.data or []

        # 2. Aggregations
        stats = {
            "total": len(tickets),
            "by_status": {},
            "by_priority": {},
            "by_type": {},
            "urgency_avg": sum(t.get("urgency_score", 0) for t in tickets) / len(tickets) if tickets else 0,
            "daily_trends": {}
        }

        for t in tickets:
            # Status count
            status = str(t.get("status") or "open").lower()
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1

            # Priority count
            priority = str(t.get("priority") or "medium").lower()
            stats["by_priority"][priority] = stats["by_priority"].get(priority, 0) + 1

            # Type count
            t_type = str(t.get("type") or "support").lower()
            stats["by_type"][t_type] = stats["by_type"].get(t_type, 0) + 1

            # Daily Trends (Last 7 days)
            created_at = t.get("created_at", "")[:10] # YYYY-MM-DD
            stats["daily_trends"][created_at] = stats["daily_trends"].get(created_at, 0) + 1

        # Format trends for charts (sorted by date)
        sorted_trends = []
        for date in sorted(stats["daily_trends"].keys()):
            sorted_trends.append({"date": date, "count": stats["daily_trends"][date]})
        stats["daily_trends"] = sorted_trends[-7:] # Keep last 7 days

        return stats
    except Exception as e:
        print(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
