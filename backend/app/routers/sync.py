# Context One - Cloud Sync Router
# Handles encrypted message sync for Pro users
# Zero-knowledge: server only stores encrypted blobs

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.utils.supabase import get_supabase_client

router = APIRouter(prefix="/api/sync", tags=["sync"])

class SyncMessage(BaseModel):
    iv: List[int]
    ciphertext: List[int]

class SyncRequest(BaseModel):
    messages: List[SyncMessage]

class SyncResponse(BaseModel):
    success: bool
    message: str
    messages_synced: int = 0

@router.post("", response_model=SyncResponse)
async def sync_messages(
    request: SyncRequest,
    user=Depends(get_current_user)
):
    """Sync encrypted messages to cloud"""
    supabase = get_supabase_client()
    
    # Store encrypted blobs - never decrypt
    user_id = user.id
    
    for msg in request.messages:
        await supabase.table("encrypted_messages").insert({
            "user_id": user_id,
            "iv": msg.iv,
            "ciphertext": msg.ciphertext
        }).execute()
    
    return SyncResponse(
        success=True,
        message="Messages synced (encrypted)",
        messages_synced=len(request.messages)
    )

@router.get("")
async def get_synced_messages(
    user=Depends(get_current_user)
):
    """Get encrypted messages from cloud"""
    supabase = get_supabase_client()
    
    user_id = user.id
    
    result = await supabase.table("encrypted_messages").select(
        "id, iv, ciphertext, created_at"
    ).eq("user_id", user_id).order("created_at", desc=True).execute()
    
    return {
        "success": True,
        "messages": result.data
    }

@router.delete("")
async def delete_synced_messages(
    user=Depends(get_current_user)
):
    """Delete all synced messages"""
    supabase = get_supabase_client()
    
    user_id = user.id
    
    await supabase.table("encrypted_messages").delete().eq("user_id", user_id).execute()
    
    return {"success": True, "message": "All synced messages deleted"}

# Placeholder - actual implementation would use proper auth
async def get_current_user():
    # TODO: Implement proper JWT verification
    class User:
        id = "placeholder-user-id"
    return User()