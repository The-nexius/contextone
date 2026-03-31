"""
Context endpoints - Core feature: search, inject, and capture context
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
from app.config import settings
from app.routers.auth import get_current_user, get_supabase
from app.services.embeddings import get_embedding, cosine_similarity

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
    conversation_id: Optional[str] = None
    ai_tool: str  # 'chatgpt', 'claude', 'gemini', 'perplexity', 'grok'
    project_id: Optional[str] = None
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
    Search across all conversations for relevant context using embeddings.
    """
    try:
        # Get embedding for the search query
        query_embedding = get_embedding(request.message)
        
        # Get all conversations for the user (optionally filtered by project)
        query = supabase.table("conversations").select(
            "id, ai_tool, title, last_message_at"
        ).eq("user_id", current_user)
        
        if request.project_id:
            query = query.eq("project_id", request.project_id)
        
        conversations = query.execute()
        
        if not conversations.data:
            return ContextSearchResponse(
                context_text="",
                sources=[],
                items_found=0,
                decisions_included=0
            )
        
        # Get messages for these conversations
        conv_ids = [c["id"] for c in conversations.data]
        messages = supabase.table("messages").select(
            "id, conversation_id, role, content"
        ).in_("conversation_id", conv_ids).order("timestamp", desc=True).limit(100).execute()
        
        if not messages.data:
            return ContextSearchResponse(
                context_text="",
                sources=[],
                items_found=0,
                decisions_included=0
            )
        
        # For now, return recent messages as context (in production, we'd compute embeddings)
        # Group messages by conversation
        context_parts = []
        sources = set()
        
        for msg in messages.data[:10]:  # Top 10 recent messages
            if msg["role"] == "user":
                context_parts.append(f"{msg['content'][:200]}...")
            elif msg["role"] == "assistant":
                context_parts.append(f"AI: {msg['content'][:200]}...")
            
            # Find the AI tool for this message
            for conv in conversations.data:
                if conv["id"] == msg["conversation_id"]:
                    sources.add(conv.get("ai_tool", "unknown"))
        
        context_text = "\n\n".join(context_parts[:5])  # Top 5 message pairs
        
        return ContextSearchResponse(
            context_text=context_text,
            sources=list(sources),
            items_found=len(messages.data),
            decisions_included=0
        )
        
    except Exception as e:
        # If embedding fails, return placeholder
        print(f"Search error: {e}")
        return ContextSearchResponse(
            context_text="Context search temporarily unavailable. Please try again.",
            sources=[],
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
    try:
        supabase.table("injection_logs").insert({
            "user_id": current_user,
            "ai_tool": "unknown",
            "context_items_injected": search_result.items_found
        }).execute()
    except:
        pass  # Don't fail if logging fails
    
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
    try:
        conversation_id = request.conversation_id
        
        # If no conversation_id, create a new conversation
        if not conversation_id:
            # Get or create default project
            project_id = request.project_id
            if not project_id:
                projects = supabase.table("projects").select("id").eq("user_id", current_user).limit(1).execute()
                if projects.data:
                    project_id = projects.data[0]["id"]
                else:
                    # Create default project
                    new_project = supabase.table("projects").insert({
                        "user_id": current_user,
                        "name": "Default Project",
                        "description": "Default project for captured conversations"
                    }).execute()
                    project_id = new_project.data[0]["id"]
            
            # Create conversation
            new_conv = supabase.table("conversations").insert({
                "project_id": project_id,
                "user_id": current_user,
                "ai_tool": request.ai_tool,
                "title": request.user_message[:50] + "..." if len(request.user_message) > 50 else request.user_message
            }).execute()
            conversation_id = new_conv.data[0]["id"]
        
        # Add user message
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": request.user_message
        }).execute()
        
        # Add AI response
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": request.ai_response
        }).execute()
        
        return {
            "message": "Context captured successfully",
            "conversation_id": conversation_id
        }
        
    except Exception as e:
        print(f"Capture error: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture context")

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