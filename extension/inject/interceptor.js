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
  // FETCH INTERCEPTION
  // ============================================
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    
    console.log('🔍 Context One: Fetch call to:', url);
    
    // Check if this is an AI API call
    const isClaudeAPI = url.includes('claude.ai') || url.includes('anthropic.com') || url.includes('/api/');
    const isChatGPTAPI = url.includes('chatgpt.com') || url.includes('openai.com') || url.includes('/backend-api');
    const isGeminiAPI = url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com');
    const isPerplexityAPI = url.includes('perplexity.ai') || url.includes('/search') || url.includes('/ask');
    const isGrokAPI = url.includes('grok.com') || url.includes('/api/') || url.includes('/chat');
    
    const isAIAPI = isClaudeAPI || isChatGPTAPI || isGeminiAPI || isPerplexityAPI || isGrokAPI;
    
    if (isAIAPI) {
      console.log('✅ Context One: Intercepted AI API call');
      
      // Get context from shared state
      const context = window.__CONTEXT_ONE_DATA__ || null;
      
      if (context && options.body) {
        try {
          const body = JSON.parse(options.body);
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
            console.log('✅ Context One: Context injection complete');
          }
          
        } catch (e) {
          console.log('❌ Context One: Error injecting context:', e.message);
        }
      } else {
        console.log('⚠️ Context One: No context available or no body to inject into');
      }
      
      // Notify isolated world about the request
      window.postMessage({
        type: 'CONTEXT_ONE_FETCH',
        url: url,
        timestamp: Date.now()
      }, '*');
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('Context One: Fetch interception set up in MAIN world');
  
  // ============================================
  // XHR INTERCEPTION
  // ============================================
  const originalXHR = window.XMLHttpRequest.prototype.open;
  
  window.XMLHttpRequest.prototype.open = function(method, url) {
    console.log('🔍 Context One: XHR call to:', url);
    
    // Check if this is an AI API call
    const isClaudeAPI = url && (url.includes('claude.ai') || url.includes('anthropic.com') || url.includes('/api/'));
    const isChatGPTAPI = url && (url.includes('chatgpt.com') || url.includes('openai.com') || url.includes('/backend-api'));
    const isGeminiAPI = url && (url.includes('generativelanguage.googleapis.com') || url.includes('gemini.google.com'));
    const isPerplexityAPI = url && (url.includes('perplexity.ai') || url.includes('/search') || url.includes('/ask'));
    const isGrokAPI = url && (url.includes('grok.com') || url.includes('/api/') || url.includes('/chat'));
    
    const isAIAPI = isClaudeAPI || isChatGPTAPI || isGeminiAPI || isPerplexityAPI || isGrokAPI;
    
    if (isAIAPI) {
      console.log('✅ Context One: Intercepted AI XHR call');
      
      const originalSend = this.send;
      const self = this;
      
      this.send = function(body) {
        const context = window.__CONTEXT_ONE_DATA__ || null;
        
        if (context && body) {
          try {
            const parsed = JSON.parse(body);
            let injected = false;
            
            if (isClaudeAPI && parsed.messages) {
              parsed.messages.unshift({ role: 'user', content: context });
              injected = true;
            }
            if (isChatGPTAPI && parsed.messages) {
              parsed.messages.unshift({ role: 'system', content: context });
              injected = true;
            }
            if (isGeminiAPI && parsed.contents) {
              parsed.contents.unshift({ role: 'user', parts: [{ text: context }] });
              injected = true;
            }
            if (isPerplexityAPI && parsed.messages) {
              parsed.messages.unshift({ role: 'user', content: context });
              injected = true;
            }
            if (isGrokAPI && parsed.messages) {
              parsed.messages.unshift({ role: 'user', content: context });
              injected = true;
            }
            
            if (injected) {
              body = JSON.stringify(parsed);
              console.log('✅ Context One: Injected context into XHR body');
            }
          } catch (e) {
            console.log('❌ Context One: XHR inject error:', e.message);
          }
        }
        
        return originalSend.call(self, body);
      };
    }
    
    return originalXHR.apply(this, arguments);
  };
  
  console.log('Context One: XHR interception set up in MAIN world');
  
  // ============================================
  // Expose function to update context from isolated world
  // ============================================
  window.__CONTEXT_ONE_SET_CONTEXT__ = function(data) {
    window.__CONTEXT_ONE_DATA__ = data;
    console.log('✅ Context One: Context updated in MAIN world');
  };
  
  console.log('Context One: MAIN world interceptor fully initialized');
})();