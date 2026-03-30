"""
Project endpoints - CRUD for user projects
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
from app.config import settings
from app.routers.auth import get_current_user, get_supabase

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3b82f6"
    icon: Optional[str] = "📁"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    created_at: str
    updated_at: str
    is_active: bool
    color: str
    icon: str

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """List all projects for current user"""
    response = supabase.table("projects").select("*").eq("user_id", current_user).execute()
    return response.data

@router.post("", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Create new project"""
    data = {
        "user_id": current_user,
        "name": project.name,
        "description": project.description,
        "color": project.color,
        "icon": project.icon
    }
    response = supabase.table("projects").insert(data).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return response.data[0]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get single project"""
    response = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", current_user).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return response.data[0]

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Update project"""
    # Build update dict
    update_data = {k: v for k, v in project.model_dump().items() if v is not None}
    
    response = supabase.table("projects").update(update_data).eq("id", project_id).eq("user_id", current_user).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return response.data[0]

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete project"""
    response = supabase.table("projects").delete().eq("id", project_id).eq("user_id", current_user).execute()
    
    if response.error:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return {"message": "Project deleted successfully"}