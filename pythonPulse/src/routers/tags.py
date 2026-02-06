from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Pydantic Models
class TagCreate(BaseModel):
    name: str
    color: str
    team_id: str

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class TicketTagCreate(BaseModel):
    ticket_id: int
    tag_id: str

# Get all tags for a team
@router.get("/tags")
@limiter.limit("30/minute")
async def get_tags(request: Request, team_id: str):
    """Get all tags for a specific team"""
    try:
        response = supabase.table("tags").select("*").eq("team_id", team_id).execute()
        return {"tags": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create a new tag
@router.post("/tags")
@limiter.limit("10/minute")
async def create_tag(request: Request, tag: TagCreate):
    """Create a new tag"""
    try:
        # Check if tag with same name exists in team
        existing = supabase.table("tags")\
            .select("*")\
            .eq("name", tag.name)\
            .eq("team_id", tag.team_id)\
            .execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Tag with this name already exists in this team")
        
        response = supabase.table("tags").insert({
            "name": tag.name,
            "color": tag.color,
            "team_id": tag.team_id
        }).execute()
        
        return {"tag": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update a tag
@router.put("/tags/{tag_id}")
@limiter.limit("10/minute")
async def update_tag(request: Request, tag_id: str, tag: TagUpdate):
    """Update an existing tag"""
    try:
        update_data = {}
        if tag.name is not None:
            update_data["name"] = tag.name
        if tag.color is not None:
            update_data["color"] = tag.color
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("tags")\
            .update(update_data)\
            .eq("id", tag_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        return {"tag": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete a tag
@router.delete("/tags/{tag_id}")
@limiter.limit("10/minute")
async def delete_tag(request: Request, tag_id: str):
    """Delete a tag"""
    try:
        response = supabase.table("tags").delete().eq("id", tag_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        return {"message": "Tag deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get tags for a specific ticket
@router.get("/tickets/{ticket_id}/tags")
@limiter.limit("30/minute")
async def get_ticket_tags(request: Request, ticket_id: int):
    """Get all tags for a specific ticket"""
    try:
        response = supabase.table("ticket_tags")\
            .select("*, tags(*)")\
            .eq("ticket_id", ticket_id)\
            .execute()
        
        tags = [item["tags"] for item in response.data if item.get("tags")]
        return {"tags": tags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add tag to ticket
@router.post("/tickets/{ticket_id}/tags")
@limiter.limit("20/minute")
async def add_ticket_tag(request: Request, ticket_id: int, data: dict):
    """Add a tag to a ticket"""
    try:
        tag_id = data.get("tag_id")
        if not tag_id:
            raise HTTPException(status_code=400, detail="tag_id is required")
        
        # Check if association already exists
        existing = supabase.table("ticket_tags")\
            .select("*")\
            .eq("ticket_id", ticket_id)\
            .eq("tag_id", tag_id)\
            .execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Tag already added to this ticket")
        
        response = supabase.table("ticket_tags").insert({
            "ticket_id": ticket_id,
            "tag_id": tag_id
        }).execute()
        
        return {"ticket_tag": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Remove tag from ticket
@router.delete("/tickets/{ticket_id}/tags/{tag_id}")
@limiter.limit("20/minute")
async def remove_ticket_tag(request: Request, ticket_id: int, tag_id: str):
    """Remove a tag from a ticket"""
    try:
        response = supabase.table("ticket_tags")\
            .delete()\
            .eq("ticket_id", ticket_id)\
            .eq("tag_id", tag_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Ticket tag association not found")
        
        return {"message": "Tag removed from ticket successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
