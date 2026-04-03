// Context One - Service Worker
// Handles context injection via messaging (no backend required)

console.log('Context One: Service worker loaded and running');

const SUPABASE_URL = 'https://xrqxmkutgrcquxffopeo.supabase.co';

// Store pending context for injection
let pendingContext = null;
let currentUser = null;

// API endpoints for each AI tool
const API_ENDPOINTS = {
  'chatgpt': [
    'https://chatgpt.com/backend-api/conversation',
    'https://chat.openai.com/backend-api/conversation',
    'https://api.openai.com/v1/chat/completions'
  ],
  'claude': [
    'https://claude.ai/api/organizations/*/chat'
  ],
  'gemini': [
    'https://generativelanguage.googleapis.com/v1beta/models/*:generateContent'
  ],
  'perplexity': [
    'https://www.perplexity.ai/api/chat'
  ],
  'grok': [
    'https://grok.com/api/chat'
  ]
};

// Set up webRequest interception for API calls
function setupWebRequestInterception() {
  // This will be called when the extension loads
  console.log('Context One: Setting up webRequest interception');
  
  // Note: In Manifest V3, we need to use declarativeNetRequest for blocking
  // But for now, we'll use a different approach - intercept in content script
}

// Store pending context for API injection
async function storePendingContext(tool, context, userMessage) {
  await chrome.storage.session.set({
    pendingContext: context,
    pendingTool: tool,
    pendingUserMessage: userMessage,
    pendingTimestamp: Date.now()
  });
  console.log('Context One: Stored pending context for', tool);
}

// Clear pending context after injection
async function clearPendingContext() {
  await chrome.storage.session.remove([
    'pendingContext',
    'pendingTool',
    'pendingUserMessage',
    'pendingTimestamp'
  ]);
}

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
  
  if (message.type === 'INJECT_MAIN_WORLD') {
    console.log('Context One SW: → handleInjectMainWorld');
    handleInjectMainWorld(message, sender).then(response => {
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

// Inject MAIN world interceptor using chrome.scripting
async function handleInjectMainWorld(message, sender) {
  const tool = message.tool;
  console.log('Context One SW: Injecting MAIN world for', tool);
  
  // Interceptor code for each tool
  const interceptors = {
    claude: `
      (function() {
        if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
        window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
        console.log('Context One: MAIN world fetch patched');
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const options = args[1] || {};
          
          if (url.includes('/completion') || url.includes('/append') || url.includes('claude.ai/api')) {
            console.log('🔍 Context One: Claude API:', url);
            
            const contextEl = document.getElementById('__context_one_data__');
            if (contextEl && contextEl.textContent && options.body) {
              try {
                const body = JSON.parse(options.body);
                if (body.messages && Array.isArray(body.messages)) {
                  body.messages.unshift({ role: 'user', content: '[Context]: ' + contextEl.textContent });
                  options.body = JSON.stringify(body);
                  console.log('✅ Context One: Injected');
                }
              } catch(e) { console.log('❌', e.message); }
            }
          }
          return originalFetch.apply(this, args);
        };
      })();
    `,
    chatgpt: `
      (function() {
        if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
        window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
        console.log('Context One: MAIN world fetch patched');
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const options = args[1] || {};
          
          if (url.includes('/backend-api/conversation') || url.includes('chatgpt.com/api')) {
            console.log('🔍 Context One: ChatGPT API:', url);
            
            const contextEl = document.getElementById('__context_one_data__');
            if (contextEl && contextEl.textContent && options.body) {
              try {
                const body = JSON.parse(options.body);
                if (body.messages && Array.isArray(body.messages)) {
                  body.messages.unshift({ role: 'system', content: '[Context]: ' + contextEl.textContent });
                  options.body = JSON.stringify(body);
                  console.log('✅ Context One: Injected');
                }
              } catch(e) { console.log('❌', e.message); }
            }
          }
          return originalFetch.apply(this, args);
        };
      })();
    `,
    gemini: `
      (function() {
        if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
        window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
        console.log('Context One: MAIN world fetch patched');
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const options = args[1] || {};
          
          if (url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com')) {
            console.log('🔍 Context One: Gemini API:', url);
            
            const contextEl = document.getElementById('__context_one_data__');
            if (contextEl && contextEl.textContent && options.body) {
              try {
                const body = JSON.parse(options.body);
                if (body.contents && Array.isArray(body.contents)) {
                  body.contents.unshift({ role: 'user', parts: [{ text: '[Context]: ' + contextEl.textContent }] });
                  options.body = JSON.stringify(body);
                  console.log('✅ Context One: Injected');
                }
              } catch(e) { console.log('❌', e.message); }
            }
          }
          return originalFetch.apply(this, args);
        };
      })();
    `,
    perplexity: `
      (function() {
        if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
        window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
        console.log('Context One: MAIN world fetch patched');
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const options = args[1] || {};
          
          if (url.includes('perplexity.ai') || url.includes('/search') || url.includes('/ask')) {
            console.log('🔍 Context One: Perplexity API:', url);
            
            const contextEl = document.getElementById('__context_one_data__');
            if (contextEl && contextEl.textContent && options.body) {
              try {
                const body = JSON.parse(options.body);
                if (body.messages && Array.isArray(body.messages)) {
                  body.messages.unshift({ role: 'user', content: '[Context]: ' + contextEl.textContent });
                  options.body = JSON.stringify(body);
                  console.log('✅ Context One: Injected');
                }
              } catch(e) { console.log('❌', e.message); }
            }
          }
          return originalFetch.apply(this, args);
        };
      })();
    `,
    grok: `
      (function() {
        if (window.__CONTEXT_ONE_FETCH_PATCHED__) return;
        window.__CONTEXT_ONE_FETCH_PATCHED__ = true;
        console.log('Context One: MAIN world fetch patched');
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          const options = args[1] || {};
          
          if (url.includes('grok.com') || url.includes('/api/') || url.includes('/chat')) {
            console.log('🔍 Context One: Grok API:', url);
            
            const contextEl = document.getElementById('__context_one_data__');
            if (contextEl && contextEl.textContent && options.body) {
              try {
                const body = JSON.parse(options.body);
                if (body.messages && Array.isArray(body.messages)) {
                  body.messages.unshift({ role: 'user', content: '[Context]: ' + contextEl.textContent });
                  options.body = JSON.stringify(body);
                  console.log('✅ Context One: Injected');
                }
              } catch(e) { console.log('❌', e.message); }
            }
          }
          return originalFetch.apply(this, args);
        };
      })();
    `
  };
  
  const code = interceptors[tool] || interceptors.chatgpt;
  
  try {
    // Use chrome.scripting.executeScript with code property
    const results = await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN',
      code: code
    });
    
    console.log('Context One SW: Injection result:', results);
    return { success: true };
  } catch (e) {
    console.log('Context One SW: Injection error:', e.message);
    return { success: false, error: e.message };
  }
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
    
    console.log('Context One: 📊 Storage check - total messages:', allMessages.length, 'activeProject:', activeProject);
    console.log('Context One: 📊 Raw messages array:', JSON.stringify(allMessages).substring(0, 500));
    
    if (allMessages.length > 0) {
      console.log('Context One: 📊 First message sample:', JSON.stringify(allMessages[0]).substring(0, 200));
    }
    
    // Filter by project if set
    let projectMessages = allMessages;
    if (activeProject) {
      projectMessages = allMessages.filter(m => m.projectId === activeProject);
      console.log('Context One: 📊 Filtered by project:', projectMessages.length, 'messages');
    } else {
      console.log('Context One: 📊 Using all messages (no project filter)');
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
    
    // Note: Injection disabled - context shows in UI
    // To re-enable, add logInjection call back
    
    const response = {
      context: context || 'No previous messages found.',
      context_items_injected: contextMessages.length,
      mode: cloudMode ? 'cloud' : 'local'
    };
    
    // Count injection when context is provided
    if (contextMessages.length > 0) {
      const injResult = await chrome.storage.local.get('injectionsThisSession');
      const injCurrent = injResult.injectionsThisSession || 0;
      await chrome.storage.local.set({ injectionsThisSession: injCurrent + 1 });
      await chrome.storage.session.set({ injectionsThisSession: injCurrent + 1 });
      console.log('Context One: Counting injection, total now:', injCurrent + 1);
    }
    
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
    console.log('Context One: 💾 Current messages count:', messages.length);
    
    // Add new message
    const newMessage = {
      id: Date.now().toString(),
      conversationId: message.conversationId || 'default',
      projectId: message.projectId || null,
      role: message.role,
      content: message.content,
      tool: message.tool,
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    console.log('Context One: 💾 New message:', JSON.stringify(newMessage).substring(0, 150));
    
    // Keep only last 100 messages
    const trimmed = messages.slice(-100);
    console.log('Context One: 💾 Saving', trimmed.length, 'messages (last 100)');
    
    // Save
    await chrome.storage.local.set({ messages: trimmed });
    
    // Update message count in BOTH local and session storage
    const msgResult = await chrome.storage.local.get('messagesThisSession');
    const current = msgResult.messagesThisSession || 0;
    await chrome.storage.local.set({ messagesThisSession: current + 1 });
    await chrome.storage.session.set({ messagesThisSession: current + 1 });
    
    // Notify popup of stats update
    const stats = await getStats();
    chrome.runtime.sendMessage({
      type: 'STATS_UPDATE',
      injections: stats.injections,
      messages: stats.messages
    }).catch(() => {});
    
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
    const result = await chrome.storage.local.get(['user', 'token', 'masterKeySalt', 'masterKeyHash', 'encryptedMasterKey']);
    
    if (!result.user || !result.token) {
      return { error: 'Not logged in' };
    }
    
    if (!result.masterKeySalt || !result.encryptedMasterKey) {
      return { error: 'No master key set. Please set up your master key first.' };
    }
    
    // Get the encrypted master key and IV from storage
    const encryptedKey = JSON.parse(result.encryptedMasterKey);
    
    // For now, we'll encrypt in the content script/popup and send already-encrypted data
    // The service worker just uploads to Supabase
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXhta3V0Z3JjcXV4ZmZvcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzY1ODEsImV4cCI6MjA5MDQ1MjU4MX0.c9kt3WWsxqd23ntQdegv9jgr2l8kqF-W4szb3gGJiKk';
    
    // Upload each message to Supabase
    for (const msg of messages) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/encrypted_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${result.token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: result.user.id,
          encrypted_blob: msg.encrypted_blob,
          iv: msg.iv,
          tool: msg.tool
        })
      });
      
      if (!response.ok) {
        console.log('Context One: Error uploading message:', await response.text());
      }
    }
    
    console.log('Context One: Synced', messages.length, 'messages to cloud');
    return { success: true, count: messages.length };
  } catch (err) {
    console.log('Context One: Sync error:', err.message);
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
    
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXhta3V0Z3JjcXV4ZmZvcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzY1ODEsImV4cCI6MjA5MDQ1MjU4MX0.c9kt3WWsxqd23ntQdegv9jgr2l8kqF-W4szb3gGJiKk';
    
    // Fetch encrypted messages from Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/encrypted_messages?user_id=eq.${result.user.id}&order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${result.token}`
        }
      }
    );
    
    if (!response.ok) {
      return { error: 'Failed to fetch from cloud' };
    }
    
    const messages = await response.json();
    console.log('Context One: Fetched', messages.length, 'messages from cloud');
    
    // Return encrypted messages - decryption happens client-side
    return { 
      success: true, 
      messages: messages.map(m => ({
        id: m.id,
        encrypted_blob: m.encrypted_blob,
        iv: m.iv,
        tool: m.tool,
        created_at: m.created_at
      }))
    };
  } catch (err) {
    console.log('Context One: Sync from cloud error:', err.message);
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