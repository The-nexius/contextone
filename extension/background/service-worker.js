// Context One - Service Worker
// Handles context injection via messaging (no backend required)

console.log('Context One: Service worker loaded and running');

const SUPABASE_URL = 'https://xrqxmkutgrcquxffopeo.supabase.co';

// Store pending context for injection
let pendingContext = null;
let currentUser = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const source = sender.tab?.url || 'popup';
  console.log('Context One SW: Received', message.type, 'from', source);
  
  if (message.type === 'GET_CONTEXT') {
    console.log('Context One SW: → handleGetContext');
    handleGetContext(message, sender).then(response => {
      console.log('Context One SW: ← handleGetContext response:', response);
      sendResponse(response);
    });
    return true;
  }
  
  if (message.type === 'CAPTURE_MESSAGE') {
    console.log('Context One SW: → handleCaptureMessage, content:', message.content?.substring(0, 50));
    handleCaptureMessage(message, sender).then(response => {
      console.log('Context One SW: ← handleCaptureMessage response:', response);
      sendResponse(response);
    });
    return true;
  }
  
  if (message.type === 'GET_USER') {
    console.log('Context One SW: → handleGetUser');
    handleGetUser().then(response => {
      console.log('Context One SW: ← handleGetUser response:', response);
      sendResponse(response);
    });
    return true;
  }
  
  if (message.type === 'SET_ACTIVE_PROJECT') {
    console.log('Context One SW: → handleSetActiveProject:', message.projectId);
    handleSetActiveProject(message.projectId).then(response => {
      console.log('Context One SW: ← handleSetActiveProject response:', response);
      sendResponse(response);
    });
    return true;
  }
  
  if (message.type === 'GET_STATS') {
    handleGetStats().then(sendResponse);
    return true;
  }
  
  if (message.type === 'TOGGLE_CLOUD_MODE') {
    handleToggleCloudMode(message.enabled).then(sendResponse);
    return true;
  }
  
  if (message.type === 'GET_MODE') {
    handleGetMode().then(sendResponse);
    return true;
  }
  
  if (message.type === 'SETUP_MASTER_KEY') {
    handleSetupMasterKey(message.password).then(sendResponse);
    return true;
  }
  
  if (message.type === 'VERIFY_MASTER_KEY') {
    handleVerifyMasterKey(message.password).then(sendResponse);
    return true;
  }
  
  if (message.type === 'SYNC_TO_CLOUD') {
    handleSyncToCloud(message.messages).then(sendResponse);
    return true;
  }
  
  if (message.type === 'SYNC_FROM_CLOUD') {
    handleSyncFromCloud().then(sendResponse);
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
    const result = await chrome.storage.local.get(['messages', 'activeProject', 'cloudMode']);
    const allMessages = result.messages || [];
    const activeProject = result.activeProject;
    const cloudMode = result.cloudMode || false;
    
    // Filter by project if set
    let projectMessages = allMessages;
    if (activeProject) {
      projectMessages = allMessages.filter(m => m.projectId === activeProject);
    }
    
    // Use semantic search if available (local mode)
    let contextMessages;
    if (!cloudMode && message.message && message.message.length > 10) {
      try {
        // Dynamic import local embeddings
        const embeddingsModule = await import('../lib/embeddings.js');
        contextMessages = await embeddingsModule.semanticSearch(
          message.message, 
          projectMessages, 
          5
        );
        console.log('Context One: Using semantic search, found', contextMessages.length, 'relevant messages');
      } catch (e) {
        console.log('Context One: Semantic search unavailable, using chronological');
        contextMessages = projectMessages.slice(-5);
      }
    } else {
      // Fallback to chronological
      contextMessages = projectMessages.slice(-5);
    }
    
    // Build context string
    const context = contextMessages.map(m => 
      `${m.role}: ${m.content.substring(0, 500)}`
    ).join('\n\n');
    
    // Log injection
    await logInjection(message.tool, contextMessages.length);
    
    const response = {
      context: context || 'No previous messages found.',
      context_items_injected: contextMessages.length,
      mode: cloudMode ? 'cloud' : 'local'
    };
    
    console.log('Context One: Returning context response:', response);
    return response;
  } catch (error) {
    console.error('Context One: Error getting context:', error);
    return { 
      error: error.message,
      context: '',
      context_items_injected: 0 
    };
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
    
    console.log('Context One: handleCaptureMessage - content:', message.content?.substring(0, 50));
    
    // Get existing messages
    const result = await chrome.storage.local.get('messages');
    const messages = result.messages || [];
    console.log('Context One: Current messages count:', messages.length);
    
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

// Toggle cloud mode (Pro feature)
async function handleToggleCloudMode(enabled) {
  await chrome.storage.local.set({ cloudMode: enabled });
  console.log('Context One: Cloud mode', enabled ? 'enabled' : 'disabled');
  return { success: true, cloudMode: enabled };
}

// Get current mode
async function handleGetMode() {
  const result = await chrome.storage.local.get('cloudMode');
  return { cloudMode: result.cloudMode || false };
}

// Setup master key for Pro encryption
async function handleSetupMasterKey(password) {
  try {
    // Generate salt
    const salt = generateSalt();
    
    // Hash password for verification
    const passwordHash = await hashPassword(password, salt);
    
    // Store salt and hash (not the password!)
    await chrome.storage.local.set({
      masterKeySalt: salt,
      masterKeyHash: passwordHash,
      hasMasterKey: true
    });
    
    console.log('Context One: Master key setup complete');
    return { success: true };
  } catch (err) {
    console.error('Context One: Master key setup failed:', err);
    return { error: err.message };
  }
}

// Verify master key password
async function handleVerifyMasterKey(password) {
  try {
    const result = await chrome.storage.local.get(['masterKeySalt', 'masterKeyHash']);
    
    if (!result.masterKeySalt || !result.masterKeyHash) {
      return { verified: false, hasMasterKey: false };
    }
    
    const hash = await hashPassword(password, result.masterKeySalt);
    const verified = hash === result.masterKeyHash;
    
    return { verified, hasMasterKey: true };
  } catch (err) {
    return { error: err.message, verified: false };
  }
}

// Sync messages to cloud (encrypted)
async function handleSyncToCloud(messages) {
  try {
    const result = await chrome.storage.local.get(['user', 'token', 'masterKeySalt']);
    
    if (!result.user || !result.token) {
      return { error: 'Not logged in' };
    }
    
    if (!result.masterKeySalt) {
      return { error: 'No master key set' };
    }
    
    // Get master key from memory (would need to be re-derived from stored key)
    // For now, return instructions to encrypt client-side
    console.log('Context One: Cloud sync - encrypt client-side first');
    
    // TODO: Implement full encryption flow
    return { success: true, message: 'Use client-side encryption' };
  } catch (err) {
    return { error: err.message };
  }
}

// Sync messages from cloud (decrypted)
async function handleSyncFromCloud() {
  try {
    const result = await chrome.storage.local.get(['user', 'token']);
    
    if (!result.user || !result.token) {
      return { error: 'Not logged in' };
    }
    
    // TODO: Implement full decryption flow
    return { success: true, message: 'Use client-side decryption' };
  } catch (err) {
    return { error: err.message };
  }
}

// Helper functions (would be imported from crypto.js in production)
async function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const hash = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'SHA-256', length: 256 },
    false,
    ['digest']
  );
  
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

console.log('Context One: Service worker loaded (local + cloud + encryption mode)');