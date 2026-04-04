// Context One - Popup Script

const API_URL = 'http://localhost:8018';
const DASHBOARD_URL = 'https://contextone.space';
const LOGIN_URL = 'https://contextone.space/login';

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
  return new Promise((resolve) => {
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
  try {
    const response = await fetch(`${API_URL}/user/stats`, {
      headers: await getAuthHeaders()
    });
    
    if (response.ok) {
      const stats = await response.json();
      document.getElementById('injectionsCount').textContent = stats.injections || 0;
      document.getElementById('messagesCount').textContent = stats.messages || 0;
    }
  } catch (error) {
    console.log('Using local stats');
    // Fall back to local storage
    chrome.storage.local.get(['injectionsThisSession', 'messagesThisSession'], (result) => {
      document.getElementById('injectionsCount').textContent = result.injectionsThisSession || 0;
      document.getElementById('messagesCount').textContent = result.messagesThisSession || 0;
    });
  }
}

async function loadProjects() {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      headers: await getAuthHeaders()
    });
    
    if (response.ok) {
      const projects = await response.json();
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
  } catch (error) {
    console.log('Could not load projects:', error);
  }
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
      chrome.tabs.create({ url: LOGIN_URL });
    });
  }
  
  // Dashboard button
  const dashboardBtn = document.getElementById('dashboardBtn');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` });
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'LOGOUT' });
      showLoggedOutContent();
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