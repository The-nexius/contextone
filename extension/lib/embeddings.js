// Context One - Local Embeddings using Transformers.js
// Provides semantic search without backend for Free tier

let embedder = null;
let embeddingModel = 'Xenova/all-MiniLM-L6-v2';

// Initialize the embedding model
async function initEmbedder() {
  if (embedder) return embedder;
  
  try {
    // Dynamic import for Transformers.js
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    
    // Set up environment
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    // Create feature extraction pipeline
    embedder = await pipeline('feature-extraction', embeddingModel);
    console.log('Context One: Local embedding model loaded');
    
    return embedder;
  } catch (err) {
    console.log('Context One: Failed to load embedding model:', err.message);
    return null;
  }
}

// Get embedding for text
async function getEmbedding(text) {
  const pipeline = await initEmbedder();
  if (!pipeline) return null;
  
  try {
    const output = await pipeline(text, {
      pooling: 'mean',
      normalize: true
    });
    
    return Array.from(output.data);
  } catch (err) {
    console.log('Context One: Embedding error:', err.message);
    return null;
  }
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Semantic search - find most relevant messages
async function semanticSearch(query, messages, topK = 5) {
  const pipeline = await initEmbedder();
  if (!pipeline) {
    // Fallback to chronological if model not loaded
    return messages.slice(-topK);
  }
  
  try {
    // Get query embedding
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) {
      return messages.slice(-topK);
    }
    
    // Score all messages
    const scored = await Promise.all(
      messages.map(async (msg) => {
        // Use cached embedding or compute new one
        let embedding = msg.embedding;
        if (!embedding) {
          embedding = await getEmbedding(msg.content);
          if (embedding) {
            msg.embedding = embedding; // Cache it
          }
        }
        
        const similarity = embedding ? cosineSimilarity(queryEmbedding, embedding) : 0;
        return { ...msg, similarity };
      })
    );
    
    // Sort by similarity and return top K
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  } catch (err) {
    console.log('Context One: Semantic search error:', err.message);
    return messages.slice(-topK);
  }
}

// Export for use in service worker
self.localEmbeddings = {
  init: initEmbedder,
  getEmbedding,
  semanticSearch
};