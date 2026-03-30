"""
Conversation endpoints - CRUD for conversations
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
from app.config import settings
from app.routers.auth import get_current_user, get_supabase

router = APIRouter()

class ConversationCreate(BaseModel):
    project_id: str
    ai_tool: str  # 'chatgpt', 'claude', 'gemini', 'perplexity', 'grok'
    title: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    ai_tool: str
    title: Optional[str]
    started_at: str
    last_message_at: str
    message_count: int

class MessageCreate(BaseModel):
    conversation_id: str
    role: str  # 'user' or 'assistant'
    content: str

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    timestamp: str

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    project_id: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List conversations for a project or all projects"""
    query = supabase.table("conversations").select("*").eq("user_id", current_user)
    
    if project_id:
        query = query.eq("project_id", project_id)
    
    response = query.order("last_message_at", desc=True).execute()
    return response.data

@router.post("", response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Create new conversation"""
    # Verify project belongs to user
    project = supabase.table("projects").select("id").eq("id", conversation.project_id).eq("user_id", current_user).execute()
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    data = {
        "project_id": conversation.project_id,
        "user_id": current_user,
        "ai_tool": conversation.ai_tool,
        "title": conversation.title or f"New {conversation.ai_tool} conversation"
    }
    
    response = supabase.table("conversations").insert(data).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return response.data[0]

@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get single conversation"""
    response = supabase.table("conversations").select("*").eq("id", conversation_id).eq("user_id", current_user).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return response.data[0]

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete conversation"""
    response = supabase.table("conversations").delete().eq("id", conversation_id).eq("user_id", current_user).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return {"message": "Conversation deleted successfully"}

# Messages endpoints
@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List messages in a conversation"""
    # Verify user owns the conversation
    conv = supabase.table("conversations").select("id,user_id").eq("id", conversation_id).execute()
    if not conv.data or conv.data[0]["user_id"] != current_user:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    response = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("timestamp").execute()
    return response.data

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def add_message(
    conversation_id: str,
    message: MessageCreate,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Add message to conversation"""
    # Verify user owns the conversation
    conv = supabase.table("conversations").select("id,user_id").eq("id", conversation_id).execute()
    if not conv.data or conv.data[0]["user_id"] != current_user:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    data = {
        "conversation_id": conversation_id,
        "role": message.role,
        "content": message.content
    }
    
    response = supabase.table("messages").insert(data).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return response.data[0]