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
  
  // Set up event listeners
  setupEventListeners();
});

async function checkAuth() {
  return new Promise(resolve => {
    chrome.storage.local.get(['user', 'token'], (result) => {
      if (result.user && result.token) {
        resolve(result);
      } else {
        resolve(null);
      }
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
      chrome.tabs.create({ url: `${DASHBOARD_URL}/help` });
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
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATS_UPDATE') {
    document.getElementById('injectionsCount').textContent = message.injections;
    document.getElementById('messagesCount').textContent = message.messages;
  }
});