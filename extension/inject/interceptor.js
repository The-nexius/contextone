// Context One - MAIN World Interceptor
// Runs in the page's main world to intercept fetch/XHR calls
// No DOM manipulation here - pure interception only

(function() {
  'use strict';
  
  console.log('Context One: MAIN world interceptor loaded');
  
  // Check if already injected
  if (window.__CONTEXT_ONE_INTERCEPTOR__) {
    console.log('Context One: Interceptor already loaded, skipping');
    return;
  }
  window.__CONTEXT_ONE_INTERCEPTOR__ = true;
  
  // ============================================
  // HELPER: Parse body to string
  // ============================================
  async function getBodyAsString(body) {
    if (!body) return null;
    
    // Already a string
    if (typeof body === 'string') {
      return body;
    }
    
    // ArrayBuffer or Blob
    if (body instanceof ArrayBuffer || body instanceof Blob) {
      const text = await new Response(body).text();
      return text;
    }
    
    // Request object
    if (body instanceof Request) {
      const text = await body.clone().text();
      return text;
    }
    
    // ReadableStream - can't easily read, skip
    if (body instanceof ReadableStream) {
      console.log('⚠️ Context One: Body is ReadableStream, cannot modify');
      return null;
    }
    
    // Other object - try JSON stringify
    try {
      return JSON.stringify(body);
    } catch (e) {
      console.log('⚠️ Context One: Cannot stringify body:', e.message);
      return null;
    }
  }
  
  // ============================================
  // FETCH INTERCEPTION
  // ============================================
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    
    console.log('🔍 Context One: Fetch call to:', url);
    
    // Check body type for debugging
    console.log('  Body type:', typeof options.body, options.body?.constructor?.name || '');
    
    // PRECISE URL FILTERS - only match actual API endpoints
    const isClaudeAPI = /claude\.ai\/api\/organizations\/[^\/]+\/chat|anthropic\.com\/v1\/chat/.test(url);
    const isChatGPTAPI = /chatgpt\.com\/backend-api\/conversation|openai\.com\/v1\/chat\/completions/.test(url);
    const isGeminiAPI = /generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent/.test(url);
    const isPerplexityAPI = /perplexity\.ai\/api\/chat|perplexity\.ai\/search/.test(url);
    const isGrokAPI = /grok\.com\/rest\/app-chat/.test(url);
    
    const isAIAPI = isClaudeAPI || isChatGPTAPI || isGeminiAPI || isPerplexityAPI || isGrokAPI;
    
    if (isAIAPI) {
      console.log('✅ Context One: Intercepted AI API call');
      
      // Get context from shared state
      const context = window.__CONTEXT_ONE_DATA__ || null;
      
      if (context && options.body) {
        try {
          // Get body as string
          const bodyStr = await getBodyAsString(options.body);
          
          if (!bodyStr) {
            console.log('⚠️ Context One: Could not read body as string');
            return originalFetch.apply(this, args);
          }
          
          console.log('  Body preview:', bodyStr.substring(0, 200));
          
          const body = JSON.parse(bodyStr);
          let injected = false;
          
          // Claude format: messages array
          if (isClaudeAPI && body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({
              role: 'user',
              content: context
            });
            injected = true;
            console.log('✅ Context One: Injected into Claude messages');
          }
          
          // ChatGPT format: messages array
          if (isChatGPTAPI && body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({
              role: 'system',
              content: context
            });
            injected = true;
            console.log('✅ Context One: Injected into ChatGPT messages');
          }
          
          // Gemini format: contents array
          if (isGeminiAPI && body.contents && Array.isArray(body.contents)) {
            body.contents.unshift({
              role: 'user',
              parts: [{ text: context }]
            });
            injected = true;
            console.log('✅ Context One: Injected into Gemini contents');
          }
          
          // Perplexity format: messages array
          if (isPerplexityAPI && body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({
              role: 'user',
              content: context
            });
            injected = true;
            console.log('✅ Context One: Injected into Perplexity messages');
          }
          
          // Grok format: messages array
          if (isGrokAPI && body.messages && Array.isArray(body.messages)) {
            body.messages.unshift({
              role: 'user',
              content: context
            });
            injected = true;
            console.log('✅ Context One: Injected into Grok messages');
          }
          
          if (injected) {
            options.body = JSON.stringify(body);
            console.log('  Modified body:', options.body.substring(0, 200));
          }
        } catch (e) {
          console.log('❌ Context One: Error modifying body:', e.message);
        }
      } else {
        console.log('  No context to inject or no body');
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // ============================================
  // XHR INTERCEPTION
  // ============================================
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    console.log('🔍 Context One: XHR open:', method, url);
    this._contextOneUrl = url;
    this._contextOneMethod = method;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    const url = this._contextOneUrl || '';
    const method = this._contextOneMethod || 'GET';
    
    // Check body type
    console.log('  XHR Body type:', typeof body, body?.constructor?.name || '');
    
    // PRECISE URL FILTERS
    const isClaudeAPI = /claude\.ai\/api\/organizations\/[^\/]+\/chat|anthropic\.com\/v1\/chat/.test(url);
    const isChatGPTAPI = /chatgpt\.com\/backend-api\/conversation|openai\.com\/v1\/chat\/completions/.test(url);
    const isGeminiAPI = /generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent/.test(url);
    const isPerplexityAPI = /perplexity\.ai\/api\/chat|perplexity\.ai\/search/.test(url);
    const isGrokAPI = /grok\.com\/rest\/app-chat/.test(url);
    
    const isAIAPI = isClaudeAPI || isChatGPTAPI || isGeminiAPI || isPerplexityAPI || isGrokAPI;
    
    if (isAIAPI && body) {
      console.log('✅ Context One: Intercepted XHR AI API call');
      
      const context = window.__CONTEXT_ONE_DATA__ || null;
      
      if (context) {
        try {
          const bodyObj = JSON.parse(body);
          let injected = false;
          
          if (isClaudeAPI && bodyObj.messages) {
            bodyObj.messages.unshift({ role: 'user', content: context });
            injected = true;
          }
          if (isChatGPTAPI && bodyObj.messages) {
            bodyObj.messages.unshift({ role: 'system', content: context });
            injected = true;
          }
          if (isGeminiAPI && bodyObj.contents) {
            bodyObj.contents.unshift({ role: 'user', parts: [{ text: context }] });
            injected = true;
          }
          if (isPerplexityAPI && bodyObj.messages) {
            bodyObj.messages.unshift({ role: 'user', content: context });
            injected = true;
          }
          if (isGrokAPI && bodyObj.messages) {
            bodyObj.messages.unshift({ role: 'user', content: context });
            injected = true;
          }
          
          if (injected) {
            body = JSON.stringify(bodyObj);
            console.log('✅ Context One: Injected context into XHR body');
          }
        } catch (e) {
          console.log('❌ Context One: Error modifying XHR body:', e.message);
        }
      }
    }
    
    return originalXHRSend.call(this, body);
  };
  
  // ============================================
  // Expose function to update context from isolated world
  // ============================================
  window.__CONTEXT_ONE_SET_CONTEXT__ = function(data) {
    window.__CONTEXT_ONE_DATA__ = data;
    console.log('✅ Context One: Context updated in MAIN world, length:', data?.length || 0);
  };
  
  console.log('Context One: MAIN world interceptor fully initialized');
})();