// ===== CLIENT-SIDE ENCRYPTION (Web Crypto) =====
// 금고 내용은 기기에서 AES-GCM으로 암호화한 뒤에만 서버로 전송된다.
// 키는 금고 암호에서 PBKDF2로 유도하며, 암호 자체는 어디에도 저장하지 않는다.
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(pass, plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return { cipher: b64(cipher), iv: b64(iv), salt: b64(salt) };
}

// 암호가 틀리면 예외를 던진다 (AES-GCM 무결성 검증 실패)
export async function decryptText(pass, data) {
  const key = await deriveKey(pass, unb64(data.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(data.iv) }, key, unb64(data.cipher));
  return dec.decode(plain);
}
