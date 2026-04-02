// Context One - Popup Script

const SUPABASE_URL = 'https://xrqxmkutgrcquxffopeo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXhta3V0Z3JjcXV4ZmZvcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzY1ODEsImV4cCI6MjA5MDQ1MjU4MX0.c9kt3WWsxqd23ntQdegv9jgr2l8kqF-W4szb3gGJiKk';
const DASHBOARD_URL = 'https://contextone.space/dashboard';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const userData = await checkAuth();
  
  if (userData) {
    showLoggedInContent(userData);
  } else {
    showLoggedOutContent();
  }
  
  // Load stats
  loadStats();
  
  // Load projects
  loadProjects();
  
  // Load recent messages
  loadRecentMessages();
  
  // Set up event listeners
  setupEventListeners();
  
  // Start polling every 2 seconds for live updates
  setInterval(() => {
    loadStats();
    loadRecentMessages();
  }, 2000);
});

async function checkAuth() {
  // First check extension storage
  return new Promise(async resolve => {
    chrome.storage.local.get(['user', 'token'], async (result) => {
      if (result.user && result.token) {
        // Verify token is still valid
        try {
          const verifyRes = await fetch('https://contextone.space/api/v1/auth/verify', {
            headers: { 'Authorization': `Bearer ${result.token}` }
          });
          if (verifyRes.ok) {
            resolve(result);
            return;
          }
        } catch (e) {}
      }
      
      // Token invalid/expired - try to get from website
      try {
        const [tab] = await chrome.tabs.query({ url: '*://contextone.space/*' });
        if (tab?.id) {
          // Send message to website
          chrome.tabs.sendMessage(tab.id, { type: 'GET_TOKEN' });
          
          // Wait for response via window postMessage
          const responseHandler = (message: any) => {
            if (message?.type === 'TOKEN_RESPONSE' && message.token) {
              chrome.storage.local.set({
                token: message.token,
                user: message.user
              });
              resolve({ token: message.token, user: message.user });
            }
          };
          
          // Also try to inject a script to get token directly
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const token = localStorage.getItem('token');
              const user = localStorage.getItem('user');
              return { token, user: user ? JSON.parse(user) : null };
            }
          }, (results) => {
            if (results?.[0]?.result?.token) {
              const { token, user } = results[0].result;
              chrome.storage.local.set({ token, user });
              resolve({ token, user });
            } else {
              resolve(null);
            }
          });
          return;
        }
      } catch (e) {
        // Website not open or not logged in
      }
      
      resolve(null);
    });
  });
}

async function supabaseLogin(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error_description || err.msg || 'Login failed');
  }
  
  return response.json();
}

function showLoggedInContent(userData) {
  document.getElementById('loggedInContent').classList.remove('hidden');
  document.getElementById('loggedOutContent').classList.add('hidden');
}

function showLoggedOutContent() {
  document.getElementById('loggedInContent').classList.add('hidden');
  document.getElementById('loggedOutContent').classList.remove('hidden');
}

async function loadStats() {
  // Use local storage stats (tracked in session)
  chrome.storage.local.get(['injectionsThisSession', 'messagesThisSession'], (result) => {
    document.getElementById('injectionsCount').textContent = result.injectionsThisSession || 0;
    document.getElementById('messagesCount').textContent = result.messagesThisSession || 0;
  });
}

async function loadRecentMessages() {
  chrome.storage.local.get('messages', (result) => {
    const messages = result.messages || [];
    const recentMessages = messages.slice(-5).reverse(); // Last 5, newest first
    
    const container = document.getElementById('recentMessages');
    if (!container) return;
    
    if (recentMessages.length === 0) {
      container.innerHTML = '<div class="text-gray-500 text-sm p-2">No messages captured yet</div>';
      return;
    }
    
    container.innerHTML = recentMessages.map(msg => {
      const toolIcon = getToolIcon(msg.tool);
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const preview = msg.content ? msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '') : '(empty)';
      
      return `
        <div class="border-b border-gray-700 py-2 last:border-0">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>${toolIcon} ${msg.tool || 'AI'}</span>
            <span>${time}</span>
          </div>
          <div class="text-gray-300 text-sm truncate">${preview}</div>
        </div>
      `;
    }).join('');
  });
}

function getToolIcon(tool) {
  const icons = {
    'claude': '🤖',
    'chatgpt': '💬',
    'perplexity': '🔍',
    'gemini': '✨',
    'grok': '🚀'
  };
  return icons[tool] || '🤖';
}

async function loadProjects() {
  // Load from localStorage (set by web app)
  const projectsStr = localStorage.getItem('projects');
  const projects = projectsStr ? JSON.parse(projectsStr) : [];
  
  const select = document.getElementById('projectSelect');
  
  // Clear existing options except first
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Add projects
  projects.forEach(project => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    select.appendChild(option);
  });
}

async function getAuthHeaders() {
  return new Promise((resolve) => {
    chrome.storage.local.get('token', (result) => {
      resolve({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.token || ''}`
      });
    });
  });
}

function setupEventListeners() {
  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      
      if (email && password) {
        loginBtn.textContent = 'Signing in...';
        loginBtn.disabled = true;
        
        try {
          const data = await supabaseLogin(email, password);
          
          // Store in chrome storage
          await new Promise(resolve => {
            chrome.storage.local.set({
              token: data.access_token,
              user: {
                id: data.user.id,
                email: data.user.email
              }
            }, resolve);
          });
          
          // Refresh popup
          location.reload();
        } catch (error) {
          alert('Login failed: ' + error.message);
          loginBtn.textContent = 'Sign In';
          loginBtn.disabled = false;
        }
      } else {
        chrome.tabs.create({ url: 'https://contextone.space/login' });
      }
    });
  }
  
  // Dashboard button
  const dashboardBtn = document.getElementById('dashboardBtn');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }
  
  // Switch project button
  const switchProjectBtn = document.getElementById('switchProjectBtn');
  if (switchProjectBtn) {
    switchProjectBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `${DASHBOARD_URL}/projects` });
    });
  }
  
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `${DASHBOARD_URL}/settings` });
    });
  }
  
  // Help link
  const helpLink = document.getElementById('helpLink');
  if (helpLink) {
    helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://contextone.space/docs' });
    });
  }
  
  // Project select change
  const projectSelect = document.getElementById('projectSelect');
  if (projectSelect) {
    projectSelect.addEventListener('change', async (e) => {
      const projectId = e.target.value;
      
      // Save to storage
      chrome.storage.local.set({ activeProject: projectId });
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'SET_ACTIVE_PROJECT',
        projectId: projectId
      });
    });
  }
  
  // Cloud mode toggle
  const cloudModeCheckbox = document.getElementById('cloudModeCheckbox');
  if (cloudModeCheckbox) {
    cloudModeCheckbox.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      
      // Check if master key is set
      if (enabled) {
        const hasMasterKey = await new Promise(resolve => {
          chrome.storage.local.get('masterKeySalt', result => {
            resolve(!!result.masterKeySalt);
          });
        });
        
        if (!hasMasterKey) {
          // Show master key modal
          e.target.checked = false;
          showMasterKeyModal();
          return;
        }
      }
      
      try {
        await chrome.runtime.sendMessage({
          type: 'TOGGLE_CLOUD_MODE',
          enabled
        });
        updateModeUI(enabled);
      } catch (err) {
        console.log('Failed to toggle cloud mode:', err);
        e.target.checked = !enabled;
      }
    });
  }
  
  // Master key modal handlers
  const masterKeyModal = document.getElementById('masterKeyModal');
  const masterKeyCancel = document.getElementById('masterKeyCancel');
  const masterKeySave = document.getElementById('masterKeySave');
  
  if (masterKeyModal && masterKeyCancel && masterKeySave) {
    masterKeyCancel.addEventListener('click', () => {
      masterKeyModal.classList.add('hidden');
      masterKeyModal.style.display = 'none';
    });
    
    masterKeySave.addEventListener('click', async () => {
      const key = document.getElementById('masterKeyInput').value;
      const confirm = document.getElementById('masterKeyConfirm').value;
      
      if (!key || key.length < 8) {
        alert('Master key must be at least 8 characters');
        return;
      }
      
      if (key !== confirm) {
        alert('Keys do not match');
        return;
      }
      
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'SETUP_MASTER_KEY',
          password: key
        });
        
        if (response.success) {
          masterKeyModal.classList.add('hidden');
          masterKeyModal.style.display = 'none';
          document.getElementById('cloudModeCheckbox').checked = true;
          await chrome.runtime.sendMessage({ type: 'TOGGLE_CLOUD_MODE', enabled: true });
          updateModeUI(true);
        } else {
          alert('Failed to set master key: ' + response.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }
  
  function showMasterKeyModal() {
    const modal = document.getElementById('masterKeyModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      document.getElementById('masterKeyInput').value = '';
      document.getElementById('masterKeyConfirm').value = '';
    }
  }
  
  // Upgrade button
  const upgradeBtn = document.getElementById('upgradeBtn');
  const upgradeModal = document.getElementById('upgradeModal');
  const upgradeCancel = document.getElementById('upgradeCancel');
  const planIndividual = document.getElementById('planIndividual');
  const planTeam = document.getElementById('planTeam');
  
  // Plan selection functions
  window.selectPlan = async function(priceId, amount) {
    const modal = document.getElementById('upgradeModal');
    modal.innerHTML = '<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px; width: 280px; text-align: center;"><h3 style="color: #00d4ff; margin-bottom: 16px;">⏳ Connecting to Stripe...</h3></div>';
    
    // Get auth token
    const token = await new Promise(resolve => {
      chrome.storage.local.get('token', result => resolve(result.token));
    });
    
    if (!token) {
      modal.innerHTML = '<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px; width: 280px; text-align: center;"><p style="color: #ff4444;">Please sign in first</p><button onclick="location.reload()" style="padding: 10px 20px; background: #00d4ff; border: none; border-radius: 8px; cursor: pointer;">OK</button></div>';
      return;
    }
    
    fetch('https://contextone.space/api/v1/billing/create-checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ price_id: priceId })
    })
    .then(r => r.json())
    .then(data => {
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
        modal.classList.add('hidden');
        modal.style.display = 'none';
      } else {
        modal.innerHTML = '<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px; width: 280px; text-align: center;"><p style="color: #ff4444;">Error: ' + (data.detail || 'Failed to create checkout') + '</p><button onclick="location.reload()" style="padding: 10px 20px; background: #00d4ff; border: none; border-radius: 8px; cursor: pointer;">Try Again</button></div>';
      }
    })
    .catch(err => {
      modal.innerHTML = '<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px; width: 280px; text-align: center;"><p style="color: #ff4444;">Error: ' + err.message + '</p><button onclick="location.reload()" style="padding: 10px 20px; background: #00d4ff; border: none; border-radius: 8px; cursor: pointer;">Try Again</button></div>';
    });
  };
  
  if (upgradeBtn && upgradeModal) {
    upgradeBtn.addEventListener('click', () => {
      upgradeModal.classList.remove('hidden');
      upgradeModal.style.display = 'flex';
    });
    
    if (upgradeCancel) {
      upgradeCancel.addEventListener('click', () => {
        upgradeModal.classList.add('hidden');
        upgradeModal.style.display = 'none';
      });
    }
    
    // Plan click handlers
    if (planIndividual) {
      planIndividual.addEventListener('click', () => window.selectPlan('prod_UFEZ2AiI2RZp49', 9));
    }
    if (planTeam) {
      planTeam.addEventListener('click', () => window.selectPlan('prod_UFEZrYvcWrEW8W', 29));
    }
  }
  
  // Load current mode
  loadCurrentMode();
}

// Load and display current mode
async function loadCurrentMode() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_MODE' });
    if (response) {
      updateModeUI(response.cloudMode);
    }
  } catch (err) {
    console.log('Failed to get mode:', err);
  }
}

// Update mode UI
function updateModeUI(cloudMode) {
  const modeIcon = document.getElementById('modeIcon');
  const modeLabel = document.getElementById('modeLabel');
  const upgradeCta = document.getElementById('upgradeCta');
  
  if (cloudMode) {
    if (modeIcon) modeIcon.textContent = '☁️';
    if (modeLabel) {
      modeLabel.textContent = 'Cloud Mode';
      modeLabel.style.color = '#f5576c';
    }
    if (upgradeCta) upgradeCta.classList.add('hidden');
  } else {
    if (modeIcon) modeIcon.textContent = '🔒';
    if (modeLabel) {
      modeLabel.textContent = 'Local Mode';
      modeLabel.style.color = '#00d4ff';
    }
    if (upgradeCta) upgradeCta.classList.remove('hidden');
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATS_UPDATE') {
    document.getElementById('injectionsCount').textContent = message.injections;
    document.getElementById('messagesCount').textContent = message.messages;
  }
});