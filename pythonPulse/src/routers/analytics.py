from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from rate_limiter import limiter
import os
import pandas as pd
import tempfile
from datetime import datetime
from dependencies import check_pro_tier

router = APIRouter()

def calculate_detailed_stats(tickets):
    """Common logic for both JSON and Excel analytics"""
    days_of_week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    stats = {
        "total": len(tickets),
        "by_status": {},
        "by_priority": {},
        "by_type": {},
        "urgency_avg": sum(t.get("urgency_score", 0) for t in tickets) / len(tickets) if tickets else 0,
        "daily_trends": {},
        "workload": {},
        "heatmap": {}
    }

    for t in tickets:
        # Status
        status = str(t.get("status") or "open").lower()
        stats["by_status"][status] = stats["by_status"].get(status, 0) + 1

        # Priority
        priority = str(t.get("priority") or "medium").lower()
        stats["by_priority"][priority] = stats["by_priority"].get(priority, 0) + 1

        # Type
        t_type = str(t.get("type") or "support").lower()
        stats["by_type"][t_type] = stats["by_type"].get(t_type, 0) + 1

        # Time-based
        created_at = t.get("created_at", "")
        if created_at:
            date_str = created_at[:10]
            stats["daily_trends"][date_str] = stats["daily_trends"].get(date_str, 0) + 1
            
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                day = days_of_week[dt.weekday()] # Maps 0-6 to Mon-Sun (wait, let's align with frontend Sun-Sat)
                # datetime.weekday() is 0 (Mon) to 6 (Sun). 
                # frontend logic: Sun (0), Mon (1)...
                # Let's adjust for frontend parity:
                day_idx = (dt.weekday() + 1) % 7
                day = days_of_week[day_idx]
                hour = dt.hour
                key = f"{day}-{hour}"
                stats["heatmap"][key] = stats["heatmap"].get(key, 0) + 1
            except: pass

        # Workload
        assignee = t.get("assignee_profile", {})
        name = assignee.get("full_name") if assignee else None
        if not name: name = "Unassigned"
        stats["workload"][name] = stats["workload"].get(name, 0) + 1

    return stats

@router.get("/analytics")
@limiter.limit("20/minute")
async def get_analytics(request: Request, user_id: str = None):
    try:
        await check_pro_tier(user_id)
        from services.supabase_client import supabase

        res = supabase.table("tickets").select("""
            id, status, priority, type, urgency_score, created_at,
            assignee_profile:profiles!tickets_assignee_id_fkey(full_name)
        """).execute()
        tickets = res.data or []
        
        stats = calculate_detailed_stats(tickets)

        # Format trends
        sorted_trends = []
        for date in sorted(stats["daily_trends"].keys()):
            sorted_trends.append({"date": date, "count": stats["daily_trends"][date]})
        stats["daily_trends"] = sorted_trends[-7:]

        # Format workload
        stats["workload"] = sorted(
            [{"name": k, "count": v} for k, v in stats["workload"].items()],
            key=lambda x: x["count"], reverse=True
        )

        # Format heatmap for frontend
        formatted_heatmap = []
        days_of_week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for day in days_of_week:
            for hour in range(24):
                formatted_heatmap.append({
                    "day": day,
                    "hour": hour,
                    "count": stats["heatmap"].get(f"{day}-{hour}", 0)
                })
        stats["heatmap"] = formatted_heatmap

        return stats
    except Exception as e:
        print(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/export")
@limiter.limit("5/minute")
async def export_analytics(request: Request, user_id: str = None):
    try:
        await check_pro_tier(user_id)
        from services.supabase_client import supabase

        # Fetch tickets with assignee names
        res = supabase.table("tickets").select("""
            *,
            assignee_profile:profiles!tickets_assignee_id_fkey(full_name)
        """).execute()
        tickets = res.data or []

        if not tickets:
             return {"message": "No ticket data found to export. Create some tickets first!"}

        stats = calculate_detailed_stats(tickets)

        # 1. Raw Tickets Sheet
        df_raw = pd.DataFrame(tickets)
        if not df_raw.empty and 'assignee_profile' in df_raw.columns:
            df_raw['assignee_name'] = df_raw['assignee_profile'].apply(lambda x: x.get('full_name') if isinstance(x, dict) else 'Unassigned')
            df_raw.drop(columns=['assignee_profile'], inplace=True, errors='ignore')

        # 2. Daily Trends
        df_trends = pd.DataFrame(sorted(stats["daily_trends"].items()), columns=['Date', 'Ticket Count'])

        # 3. Distributions
        df_status = pd.DataFrame(list(stats["by_status"].items()), columns=['Status', 'Count'])
        df_priority = pd.DataFrame(list(stats["by_priority"].items()), columns=['Priority', 'Count'])
        df_type = pd.DataFrame(list(stats["by_type"].items()), columns=['Type', 'Count'])

        # 4. Workload
        df_workload = pd.DataFrame(list(stats["workload"].items()), columns=['Assignee', 'Active Tickets']).sort_values('Active Tickets', ascending=False)

        # 5. Activity Map (Heatmap)
        heatmap_data = []
        days_of_week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for day in days_of_week:
            row = {'Day': day}
            for hour in range(24):
                row[f"{hour}:00"] = stats["heatmap"].get(f"{day}-{hour}", 0)
            heatmap_data.append(row)
        df_heatmap = pd.DataFrame(heatmap_data)

        # Create Excel in temporary file
        fd, path = tempfile.mkstemp(suffix=".xlsx")
        try:
            with pd.ExcelWriter(path, engine='openpyxl') as writer:
                df_raw.to_excel(writer, sheet_name='Raw Tickets', index=False)
                df_trends.to_excel(writer, sheet_name='Daily Trends', index=False)
                df_status.to_excel(writer, sheet_name='Status Distribution', index=False)
                df_priority.to_excel(writer, sheet_name='Priority Distribution', index=False)
                df_type.to_excel(writer, sheet_name='Type Breakdown', index=False)
                df_workload.to_excel(writer, sheet_name='Team Workload', index=False)
                df_heatmap.to_excel(writer, sheet_name='Activity Map', index=False)
            
            return FileResponse(
                path, 
                filename="ProjectPulse_Intelligence_Analytics.xlsx",
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        finally:
            os.close(fd)
    except Exception as e:
        print(f"Export Error: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
