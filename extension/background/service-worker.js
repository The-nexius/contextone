// Context One - Service Worker (MV3 Compatible)
// No webRequest blocking - uses message passing instead

const API_URL = 'http://localhost:8018';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CONTEXT') {
    handleGetContext(message).then(sendResponse);
    return true;
  }

  if (message.type === 'CAPTURE_MESSAGE') {
    handleCaptureMessage(message).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_USER') {
    handleGetUser().then(sendResponse);
    return true;
  }

  if (message.type === 'GET_STATS') {
    handleGetStats().then(sendResponse);
    return true;
  }

  if (message.type === 'LOGIN') {
    handleLogin(message).then(sendResponse);
    return true;
  }

  if (message.type === 'LOGOUT') {
    handleLogout().then(sendResponse);
    return true;
  }
});

// Get user from storage
async function handleGetUser() {
  const result = await chrome.storage.local.get(['user', 'token']);
  if (result.user && result.token) {
    return { user: result.user, token: result.token };
  }
  return null;
}

// Login
async function handleLogin(message) {
  await chrome.storage.local.set({
    user: message.user,
    token: message.token
  });
  return { success: true };
}

// Logout
async function handleLogout() {
  await chrome.storage.local.remove(['user', 'token']);
  return { success: true };
}

// Get context for injection
async function handleGetContext(message) {
  try {
    const { user, token } = await handleGetUser();

    if (!user) {
      return { error: 'not_logged_in', message: 'Please log in from the popup' };
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
async function handleCaptureMessage(message) {
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

    // Update message count
    const result = await chrome.storage.local.get('messagesThisSession');
    const count = (result.messagesThisSession || 0) + 1;
    await chrome.storage.local.set({ messagesThisSession: count });

    return await response.json();
  } catch (error) {
    console.error('Context One: Error capturing message:', error);
    return { error: error.message };
  }
}

// Get session stats
async function handleGetStats() {
  const result = await chrome.storage.local.get(['injectionsThisSession', 'messagesThisSession', 'user']);
  return {
    injections: result.injectionsThisSession || 0,
    messages: result.messagesThisSession || 0,
    isLoggedIn: !!result.user
  };
}

// Log injection for analytics
async function logInjection(aiTool, contextCount) {
  const result = await chrome.storage.local.get('injectionsThisSession');
  const count = (result.injectionsThisSession || 0) + 1;
  await chrome.storage.local.set({ injectionsThisSession: count });

  // Update badge
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: '#00d4ff' });
}

console.log('Context One: Service worker loaded (MV3)');
