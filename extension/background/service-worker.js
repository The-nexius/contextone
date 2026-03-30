// Context One - Service Worker
// Handles API interception and context injection

const API_URL = 'http://3.235.139.249:8001';
const SUPABASE_URL = 'https://xrqxmkutgrcquxffopeo.supabase.co';

// Store pending context for injection
let pendingContext = null;
let currentUser = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CONTEXT') {
    handleGetContext(message, sender).then(sendResponse);
    return true;
  }
  
  if (message.type === 'CAPTURE_MESSAGE') {
    handleCaptureMessage(message, sender).then(sendResponse);
    return true;
  }
  
  if (message.type === 'GET_USER') {
    handleGetUser().then(sendResponse);
    return true;
  }
  
  if (message.type === 'SET_ACTIVE_PROJECT') {
    handleSetActiveProject(message.projectId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'GET_STATS') {
    handleGetStats().then(sendResponse);
    return true;
  }
});

// Get user from storage
async function handleGetUser() {
  const result = await chrome.storage.local.get(['user', 'token']);
  if (result.user && result.token) {
    currentUser = result.user;
    return { user: result.user, token: result.token };
  }
  return null;
}

// Get context for injection
async function handleGetContext(message, sender) {
  try {
    const { user, token } = await handleGetUser();
    
    if (!user) {
      return { error: 'not_logged_in', message: 'Please log in from the dashboard' };
    }
    
    const response = await fetch(`${API_URL}/context/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message.message,
        project_id: message.projectId || null,
        max_tokens: message.maxTokens || 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log injection
    await logInjection(message.tool, data.context_items_injected || 0);
    
    return data;
  } catch (error) {
    console.error('Context One: Error getting context:', error);
    return { error: error.message };
  }
}

// Capture message for storage
async function handleCaptureMessage(message, sender) {
  try {
    const { user, token } = await handleGetUser();
    
    if (!user) {
      return { error: 'not_logged_in' };
    }
    
    const response = await fetch(`${API_URL}/context/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversation_id: message.conversationId,
        role: message.role,
        content: message.content,
        ai_tool: message.tool
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Context One: Error capturing message:', error);
    return { error: error.message };
  }
}

// Set active project
async function handleSetActiveProject(projectId) {
  await chrome.storage.local.set({ activeProject: projectId });
  return { success: true };
}

// Get session stats
async function handleGetStats() {
  const result = await chrome.storage.local.get(['injectionsThisSession', 'messagesThisSession']);
  return {
    injections: result.injectionsThisSession || 0,
    messages: result.messagesThisSession || 0
  };
}

// Log injection for analytics
async function logInjection(aiTool, contextCount) {
  // Update local stats
  const result = await chrome.storage.local.get('injectionsThisSession');
  const current = result.injectionsThisSession || 0;
  await chrome.storage.local.set({ injectionsThisSession: current + 1 });
  
  // Update badge
  chrome.action.setBadgeText({ text: String(current + 1) });
  chrome.action.setBadgeBackgroundColor({ color: '#00d4ff' });
}

// WebRequest interceptor for API calls
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (details.method !== 'POST') return;
    
    // Check if we have pending context
    const result = await chrome.storage.session.get('pendingContext');
    if (!result.pendingContext) return;
    
    // Determine which AI tool based on URL
    const url = details.url;
    let modifiedBody = null;
    
    if (url.includes('chat.openai.com')) {
      // ChatGPT - inject into messages
      modifiedBody = injectIntoChatGPT(details.requestBody, result.pendingContext);
    } else if (url.includes('claude.ai') || url.includes('api.anthropic.com')) {
      // Claude - inject into system prompt
      modifiedBody = injectIntoClaude(details.requestBody, result.pendingContext);
    } else if (url.includes('generativelanguage.googleapis.com')) {
      // Gemini
      modifiedBody = injectIntoGemini(details.requestBody, result.pendingContext);
    }
    
    if (modifiedBody) {
      await chrome.storage.session.remove('pendingContext');
      return { requestBody: modifiedBody };
    }
  },
  { urls: [
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://api.anthropic.com/*',
    'https://generativelanguage.googleapis.com/*'
  ]},
  ['requestBody', 'blocking']
);

// Helper: Inject context into ChatGPT request
function injectIntoChatGPT(body, context) {
  try {
    const decoder = new TextDecoder('utf-8');
    const bodyStr = decoder.decode(body);
    const bodyObj = JSON.parse(bodyStr);
    
    // Add context as system message
    if (!bodyObj.messages) bodyObj.messages = [];
    
    const systemMessage = {
      role: 'system',
      content: `Relevant context from your previous conversations:\n\n${context}`
    };
    
    // Insert after existing system messages
    bodyObj.messages = [systemMessage, ...bodyObj.messages];
    
    const encoder = new TextEncoder();
    return encoder.encode(JSON.stringify(bodyObj)).buffer;
  } catch (e) {
    console.error('Error injecting into ChatGPT:', e);
    return body;
  }
}

// Helper: Inject context into Claude request
function injectIntoClaude(body, context) {
  try {
    const decoder = new TextDecoder('utf-8');
    const bodyStr = decoder.decode(body);
    const bodyObj = JSON.parse(bodyStr);
    
    // Add to system prompt
    if (!bodyObj.system) bodyObj.system = '';
    bodyObj.system += `\n\nRelevant context from previous conversations:\n${context}`;
    
    const encoder = new TextEncoder();
    return encoder.encode(JSON.stringify(bodyObj)).buffer;
  } catch (e) {
    console.error('Error injecting into Claude:', e);
    return body;
  }
}

// Helper: Inject context into Gemini request
function injectIntoGemini(body, context) {
  try {
    const decoder = new TextDecoder('utf-8');
    const bodyStr = decoder.decode(body);
    const bodyObj = JSON.parse(bodyStr);
    
    // Add as first message with system instruction
    if (!bodyObj.systemInstruction) {
      bodyObj.systemInstruction = {
        role: 'system',
        parts: [{ text: `Relevant context from previous conversations:\n${context}` }]
      };
    }
    
    const encoder = new TextEncoder();
    return encoder.encode(JSON.stringify(bodyObj)).buffer;
  } catch (e) {
    console.error('Error injecting into Gemini:', e);
    return body;
  }
}

console.log('Context One: Service worker loaded');