// Context One - Master Key Encryption
// AES-256-GCM encryption for Pro cloud sync
// Zero-knowledge: server never sees plaintext

// Derive master key from password using PBKDF2
async function deriveMasterKey(password, salt) {
  const encoder = new TextEncoder();
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive 256-bit key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with AES-256-GCM
async function encryptData(masterKey, plaintext) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    encoder.encode(plaintext)
  );
  
  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}

// Decrypt data with AES-256-GCM
async function decryptData(masterKey, encrypted) {
  const decoder = new TextDecoder();
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    masterKey,
    new Uint8Array(encrypted.ciphertext)
  );
  
  return decoder.decode(plaintext);
}

// Encrypt all messages for cloud sync
async function encryptMessages(messages, masterKey) {
  const encrypted = await Promise.all(
    messages.map(async (msg) => {
      const data = JSON.stringify(msg);
      const encrypted = await encryptData(masterKey, data);
      return encrypted;
    })
  );
  return encrypted;
}

// Decrypt all messages from cloud sync
async function decryptMessages(encrypted, masterKey) {
  const decrypted = await Promise.all(
    encrypted.map(async (enc) => {
      const data = await decryptData(masterKey, enc);
      return JSON.parse(data);
    })
  );
  return decrypted;
}

// Generate random salt
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash password for verification
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

// Export for use
self.contextOneCrypto = {
  deriveMasterKey,
  encryptData,
  decryptData,
  encryptMessages,
  decryptMessages,
  generateSalt,
  hashPassword
};