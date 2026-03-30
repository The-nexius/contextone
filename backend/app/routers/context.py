"""
Context endpoints - Core feature: search, inject, and capture context
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
from app.config import settings
from app.routers.auth import get_current_user, get_supabase

router = APIRouter()

class ContextSearchRequest(BaseModel):
    message: str
    project_id: Optional[str] = None
    max_tokens: int = 2000

class ContextSearchResponse(BaseModel):
    context_text: str
    sources: List[str]
    items_found: int
    decisions_included: int

class ContextInjectRequest(BaseModel):
    message: str
    project_id: Optional[str] = None
    max_tokens: int = 2000

class ContextCaptureRequest(BaseModel):
    conversation_id: str
    user_message: str
    ai_response: str

class KeyDecisionCreate(BaseModel):
    project_id: str
    decision: str
    context: Optional[str] = None
    source_conversation_id: Optional[str] = None

@router.post("/search", response_model=ContextSearchResponse)
async def search_context(
    request: ContextSearchRequest,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Search across all conversations for relevant context.
    This is the core feature - semantic search using embeddings.
    """
    # For now, return a placeholder response
    # In production, this would:
    # 1. Generate embedding for the message
    # 2. Search using pgvector similarity
    # 3. Return relevant context
    
    return ContextSearchResponse(
        context_text="This is a placeholder. In production, this will search embeddings.",
        sources=["chatgpt", "claude"],
        items_found=0,
        decisions_included=0
    )

@router.post("/inject", response_model=ContextSearchResponse)
async def inject_context(
    request: ContextInjectRequest,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get context to inject into an AI tool.
    This is called before the user sends a message.
    """
    # Search for relevant context
    search_result = await search_context(
        ContextSearchRequest(
            message=request.message,
            project_id=request.project_id,
            max_tokens=request.max_tokens
        ),
        current_user,
        supabase
    )
    
    # Log the injection for analytics
    supabase.table("injection_logs").insert({
        "user_id": current_user,
        "ai_tool": "unknown",  # Would be passed in request
        "context_items_injected": search_result.items_found
    }).execute()
    
    return search_result

@router.post("/capture")
async def capture_context(
    request: ContextCaptureRequest,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Capture a conversation turn for future context.
    Called after a message is sent and response received.
    """
    # Verify user owns the conversation
    conv = supabase.table("conversations").select("id,user_id").eq("id", request.conversation_id).execute()
    if not conv.data or conv.data[0]["user_id"] != current_user:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Add user message
    supabase.table("messages").insert({
        "conversation_id": request.conversation_id,
        "role": "user",
        "content": request.user_message
    }).execute()
    
    # Add AI response
    supabase.table("messages").insert({
        "conversation_id": request.conversation_id,
        "role": "assistant",
        "content": request.ai_response
    }).execute()
    
    return {"message": "Context captured successfully"}

# Key Decisions endpoints
@router.get("/decisions")
async def list_key_decisions(
    project_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List key decisions for a project"""
    # Verify project belongs to user
    project = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", current_user).execute()
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    response = supabase.table("key_decisions").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
    return response.data

@router.post("/decisions")
async def create_key_decision(
    decision: KeyDecisionCreate,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Create a key decision"""
    # Verify project belongs to user
    project = supabase.table("projects").select("id").eq("id", decision.project_id).eq("user_id", current_user).execute()
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    data = {
        "project_id": decision.project_id,
        "decision": decision.decision,
        "context": decision.context,
        "source_conversation_id": decision.source_conversation_id
    }
    
    response = supabase.table("key_decisions").insert(data).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return response.data[0]

@router.delete("/decisions/{decision_id}")
async def delete_key_decision(
    decision_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete a key decision"""
    # Get the decision first
    decision = supabase.table("key_decisions").select("id,project_id").eq("id", decision_id).execute()
    if not decision.data:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Verify project belongs to user
    project = supabase.table("projects").select("id").eq("id", decision.data[0]["project_id"]).eq("user_id", current_user).execute()
    if not project.data:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    response = supabase.table("key_decisions").delete().eq("id", decision_id).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return {"message": "Decision deleted successfully"}