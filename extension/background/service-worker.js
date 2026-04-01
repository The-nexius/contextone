// Context One - Service Worker
// Handles context injection via messaging (no backend required)

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

// Get context for injection (from local storage)
async function handleGetContext(message, sender) {
  try {
    // Allow local-only mode without login
    // const { user } = await handleGetUser();
    // if (!user) {
    //   return { error: 'not_logged_in', message: 'Please log in from the extension' };
    // }
    
    // Get stored messages from local storage
    const result = await chrome.storage.local.get(['messages', 'activeProject']);
    const allMessages = result.messages || [];
    const activeProject = result.activeProject;
    
    // Filter by project if set
    let projectMessages = allMessages;
    if (activeProject) {
      projectMessages = allMessages.filter(m => m.projectId === activeProject);
    }
    
    // Get last N messages for context
    const contextMessages = projectMessages.slice(-10);
    
    // Build context string
    const context = contextMessages.map(m => 
      `${m.role}: ${m.content.substring(0, 500)}`
    ).join('\n\n');
    
    // Log injection
    await logInjection(message.tool, contextMessages.length);
    
    return {
      context: context || 'No previous messages found.',
      context_items_injected: contextMessages.length
    };
  } catch (error) {
    console.error('Context One: Error getting context:', error);
    return { error: error.message };
  }
}

// Capture message for storage
async function handleCaptureMessage(message, sender) {
  try {
    // Allow local-only mode without login
    // const { user } = await handleGetUser();
    // if (!user) {
    //   return { error: 'not_logged_in' };
    // }
    
    // Get existing messages
    const result = await chrome.storage.local.get('messages');
    const messages = result.messages || [];
    
    // Add new message
    messages.push({
      id: Date.now().toString(),
      conversationId: message.conversationId || 'default',
      projectId: message.projectId || null,
      role: message.role,
      content: message.content,
      tool: message.tool,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 messages
    const trimmed = messages.slice(-100);
    
    // Save
    await chrome.storage.local.set({ messages: trimmed });
    
    // Update message count
    const msgResult = await chrome.storage.local.get('messagesThisSession');
    const current = msgResult.messagesThisSession || 0;
    await chrome.storage.local.set({ messagesThisSession: current + 1 });
    
    return { success: true };
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

console.log('Context One: Service worker loaded (local storage mode)');