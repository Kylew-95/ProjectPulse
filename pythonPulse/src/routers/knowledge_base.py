from fastapi import APIRouter, HTTPException, Query, Request
from services.supabase_client import supabase
from dependencies import check_ai_access
from rate_limiter import limiter

router = APIRouter()

@router.get("")
@limiter.limit("30/minute")
async def get_knowledge_base(request: Request, user_id: str = Query(...)):
    try:
        await check_ai_access(user_id)
        
        # Fetch entries, ordered by newest first
        res = supabase.table("knowledge_base").select("*").order("created_at", desc=True).execute()
        
        return res.data or []
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"KB Fetch Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
@limiter.limit("10/minute")
async def add_knowledge_base(request: Request, data: dict):
    try:
        user_id = data.get("user_id")
        await check_ai_access(user_id)
        
        # Clean data for Supabase (remove user_id as it's not in the table schema)
        kb_data = {k: v for k, v in data.items() if k != "user_id"}
        
        res = supabase.table("knowledge_base").insert(kb_data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"KB Insert Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{kb_id}")
@limiter.limit("10/minute")
async def update_knowledge_base(request: Request, kb_id: int, data: dict):
    try:
        user_id = data.get("user_id")
        await check_ai_access(user_id)
        
        # Clean data
        kb_data = {k: v for k, v in data.items() if k != "user_id"}
        
        res = supabase.table("knowledge_base").update(kb_data).eq("id", kb_id).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"KB Update Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{kb_id}")
@limiter.limit("10/minute")
async def delete_knowledge_base(request: Request, kb_id: int, user_id: str = Query(...)):
    try:
        await check_ai_access(user_id)
        
        supabase.table("knowledge_base").delete().eq("id", kb_id).execute()
        return {"status": "success"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"KB Delete Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
