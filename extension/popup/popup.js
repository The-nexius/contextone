// Context One - Popup Script

const SUPABASE_URL = 'https://xrqxmkutgrcquxffopeo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXhta3V0Z3JjcXV4ZmZvcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzY1ODEsImV4cCI6MjA5MDQ1MjU4MX0.c9kt3WWsxqd23ntQdegv9jgr2l8kqF-W4szb3gGJiKk';
const DASHBOARD_URL = 'https://contextone.space/dashboard';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in via Supabase
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
  // First check localStorage (set by web app)
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  const userEmail = localStorage.getItem('user_email');
  
  if (token && userId) {
    // Sync to chrome storage for extension use
    await new Promise(resolve => {
      chrome.storage.local.set({ 
        token: token, 
        user: { id: userId, email: userEmail } 
      }, resolve);
    });
    return { token, user: { id: userId, email: userEmail } };
  }
  
  // Also check chrome storage directly
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
    loginBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
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