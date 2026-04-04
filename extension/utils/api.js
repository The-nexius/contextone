// Context One - API Utility

// Use localStorage set by popup, or default to localhost for dev
const API_URL = window.localStorage.getItem('apiUrl') || 'http://3.235.139.249:8018';

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const { token } = await getAuth();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get auth token from storage
 */
function getAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['user', 'token'], resolve);
  });
}

/**
 * Search context
 */
async function searchContext(query, projectId = null) {
  return apiRequest('/context/search', {
    method: 'POST',
    body: JSON.stringify({ query, project_id: projectId })
  });
}

/**
 * Get injection context
 */
async function getInjectionContext(message, projectId = null, maxTokens = 2000) {
  return apiRequest('/context/inject', {
    method: 'POST',
    body: JSON.stringify({
      message,
      project_id: projectId,
      max_tokens: maxTokens
    })
  });
}

/**
 * Capture message
 */
async function captureMessage(conversationId, role, content, aiTool) {
  return apiRequest('/context/capture', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
      role,
      content,
      ai_tool: aiTool
    })
  });
}

/**
 * Get user projects
 */
async function getProjects() {
  return apiRequest('/projects');
}

/**
 * Get user profile
 */
async function getProfile() {
  return apiRequest('/user/profile');
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ContextOneAPI = {
    apiRequest,
    getAuth,
    searchContext,
    getInjectionContext,
    captureMessage,
    getProjects,
    getProfile
  };
}