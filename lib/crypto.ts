import { AppLanguage, isSupportedLanguage } from '@/lib/i18n';

export const E2EE_MARKER = '<!-- WEBAPP-E2EE-V1 -->';
export const E2EE_STORAGE_KEY = 'webapp_e2ee_master_key';

const PBKDF2_ITERATIONS = 100_000;
const derivedKeyCache = new Map<string, CryptoKey>();

/**
 * Chunk-safe Uint8Array -> Base64 encoder (prevents Maximum Call Stack Size Exceeded on large notes)
 */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < sub.length; j++) {
      binary += String.fromCharCode(sub[j]);
    }
  }
  return btoa(binary);
}

/**
 * Clean Base64 -> Uint8Array decoder
 */
export function base64ToUint8(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks with 100% precision whether a raw Markdown string is an E2EE encrypted note.
 */
export function isEncryptedContent(content: string | undefined | null): boolean {
  if (!content || typeof content !== 'string') return false;
  if (content.includes(E2EE_MARKER)) return true;
  return /```webapp-encrypted[\s\S]*?v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+[\s\S]*?```/.test(content);
}

/**
 * Extracts the salt, IV, and ciphertext Base64 components from an encrypted note.
 */
export function extractEncryptedPayload(raw: string): {
  saltB64: string;
  ivB64: string;
  cipherB64: string;
} | null {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/v1:([A-Za-z0-9+/=]+):([A-Za-z0-9+/=]+):([A-Za-z0-9+/=]+)/);
  if (!match) return null;
  return {
    saltB64: match[1],
    ivB64: match[2],
    cipherB64: match[3],
  };
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a password and 16-byte salt using PBKDF2-SHA256.
 * Caches derived keys in memory by (password + salt) for instant repeated decryptions.
 */
async function deriveAesGcmKey(password: string, salt: Uint8Array, saltB64: string): Promise<CryptoKey> {
  const cacheKey = `${password}::${saltB64}`;
  const cached = derivedKeyCache.get(cacheKey);
  if (cached) return cached;

  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  if (derivedKeyCache.size > 250) {
    const firstKey = derivedKeyCache.keys().next().value;
    if (firstKey) derivedKeyCache.delete(firstKey);
  }
  derivedKeyCache.set(cacheKey, aesKey);
  return aesKey;
}

/**
 * Encrypts a UTF-8 Markdown document into a self-contained Zero-Knowledge E2EE Markdown envelope.
 * Includes a safeguard that never double-encrypts already encrypted content.
 */
export async function encryptNoteContent(plainMarkdown: string, password: string): Promise<string> {
  if (!password) {
    throw new Error('E2EE_PASSWORD_REQUIRED');
  }
  // Never double-encrypt if already encrypted
  if (isEncryptedContent(plainMarkdown)) {
    return plainMarkdown;
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const saltB64 = uint8ToBase64(salt);
  const ivB64 = uint8ToBase64(iv);

  const key = await deriveAesGcmKey(password, salt, saltB64);
  const encodedPlain = new TextEncoder().encode(plainMarkdown);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    encodedPlain as unknown as BufferSource
  );

  const cipherB64 = uint8ToBase64(new Uint8Array(cipherBuffer));

  return [
    E2EE_MARKER,
    '🔒 **Nota Cifrada de Extremo a Extremo (AES-256-GCM)**',
    'Este documento está protegido con cifrado de conocimiento cero (*Zero-Knowledge*) en Webapp. Ni GitHub ni terceros pueden leer su contenido sin tu Contraseña Maestra.',
    '',
    '```webapp-encrypted',
    `v1:${saltB64}:${ivB64}:${cipherB64}`,
    '```',
    '',
  ].join('\n');
}

/**
 * Decrypts a Zero-Knowledge E2EE Markdown envelope back into the exact original UTF-8 Markdown string.
 * If the content is plain text (not encrypted), returns it untouched.
 * If the password is wrong or missing, throws an explicit error (never returns corrupted text).
 */
export async function decryptNoteContent(rawContent: string, password: string): Promise<string> {
  if (!rawContent || !isEncryptedContent(rawContent)) {
    return rawContent;
  }
  if (!password) {
    throw new Error('E2EE_PASSWORD_REQUIRED');
  }

  const payload = extractEncryptedPayload(rawContent);
  if (!payload) {
    throw new Error('E2EE_CORRUPTED_PAYLOAD');
  }

  const salt = base64ToUint8(payload.saltB64);
  const iv = base64ToUint8(payload.ivB64);
  const cipherBytes = base64ToUint8(payload.cipherB64);

  const key = await deriveAesGcmKey(password, salt, payload.saltB64);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      cipherBytes as unknown as BufferSource
    );

    return new TextDecoder('utf-8', { fatal: false }).decode(decryptedBuffer);
  } catch {
    throw new Error('INVALID_E2EE_PASSWORD');
  }
}

const VERIFIER_PLAINTEXT = 'WEBAPP_E2EE_VERIFIER_OK_V1';

/**
 * Creates a compact encrypted verifier string to validate the Master Password locally.
 */
export async function createVaultVerifier(password: string): Promise<string> {
  const encrypted = await encryptNoteContent(VERIFIER_PLAINTEXT, password);
  const payload = extractEncryptedPayload(encrypted);
  if (!payload) throw new Error('Failed to create verifier');
  return `v1:${payload.saltB64}:${payload.ivB64}:${payload.cipherB64}`;
}

/**
 * Verifies whether a candidate password matches a previously created vault verifier.
 */
export async function verifyVaultPassword(verifier: string, password: string): Promise<boolean> {
  if (!verifier || !password) return false;
  try {
    const wrapped = `${E2EE_MARKER}\n\`\`\`webapp-encrypted\n${verifier}\n\`\`\``;
    const res = await decryptNoteContent(wrapped, password);
    return res === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}

/**
 * Reads/writes the local Master Password in browser storage (never sent to server/GitHub).
 */
export function getStoredMasterPassword(): string {
  if (typeof window === 'undefined') return '';
  try {
    const sessionVal = sessionStorage.getItem(E2EE_STORAGE_KEY);
    if (sessionVal) return new TextDecoder('utf-8').decode(base64ToUint8(sessionVal));
    const localVal = localStorage.getItem(E2EE_STORAGE_KEY);
    if (localVal) return new TextDecoder('utf-8').decode(base64ToUint8(localVal));
  } catch {
    // ignore storage errors
  }
  return '';
}

export function setStoredMasterPassword(password: string, rememberOnDevice = true): void {
  if (typeof window === 'undefined') return;
  try {
    if (!password) {
      localStorage.removeItem(E2EE_STORAGE_KEY);
      sessionStorage.removeItem(E2EE_STORAGE_KEY);
      return;
    }
    const encoded = uint8ToBase64(new TextEncoder().encode(password));
    sessionStorage.setItem(E2EE_STORAGE_KEY, encoded);
    if (rememberOnDevice) {
      localStorage.setItem(E2EE_STORAGE_KEY, encoded);
    } else {
      localStorage.removeItem(E2EE_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearStoredMasterPassword(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(E2EE_STORAGE_KEY);
    sessionStorage.removeItem(E2EE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Downloads a single decrypted Markdown note (.md) to the user's computer.
 */
export function exportSingleNoteAsMarkdown(notePathOrName: string, plainMarkdownContent: string): void {
  if (typeof document === 'undefined') return;
  const baseName = (notePathOrName.split('/').pop() || 'Nota').replace(/\.md$/i, '').trim() || 'Nota';
  const safeFileName = `${baseName.replace(/[<>:"/\\|?*]/g, '-')}.md`;

  const blob = new Blob([plainMarkdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Precomputed IEEE 802.3 CRC-32 Lookup Table for standard ZIP archives
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Creates a standard, spec-compliant PKZIP (.zip) archive in memory with UTF-8 filenames
 * and full folder hierarchy support. Zero external dependencies required.
 */
export function createZipArchive(files: Array<{ path: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const cleanPath = file.path.replace(/^\/+/, '').replace(/\\/g, '/');
    const nameBytes = encoder.encode(cleanPath);
    const dataBytes = encoder.encode(file.content);
    const fileCrc = crc32(dataBytes);

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // General purpose bit flag: Bit 11 = UTF-8
    lv.setUint16(8, 0, true); // Compression method: 0 (Store)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, fileCrc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    // Central directory file header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central file header signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed to extract
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // Store method
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, fileCrc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const part of centralParts) {
    centralSize += part.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true); // Number of this disk
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, files.length, true); // Total entries on this disk
  ev.setUint16(10, files.length, true); // Total entries in central directory
  ev.setUint32(12, centralSize, true); // Size of central directory
  ev.setUint32(16, offset, true); // Offset of central directory
  ev.setUint16(20, 0, true); // Comment length

  const totalSize = offset + centralSize + eocd.length;
  const zipBytes = new Uint8Array(totalSize);
  let ptr = 0;
  for (const part of localParts) {
    zipBytes.set(part, ptr);
    ptr += part.length;
  }
  for (const part of centralParts) {
    zipBytes.set(part, ptr);
    ptr += part.length;
  }
  zipBytes.set(eocd, ptr);

  return zipBytes;
}

/**
 * Triggers a browser download of a complete decrypted vault as a .zip file.
 */
export function exportVaultAsZip(
  files: Array<{ path: string; content: string }>,
  zipFilename?: string
): void {
  if (typeof document === 'undefined') return;
  const dateStr = new Date().toISOString().split('T')[0];
  const finalName = zipFilename || `webapp-notas-${dateStr}.zip`;
  const zipBytes = createZipArchive(files);

  const blob = new Blob([zipBytes as unknown as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export interface SecurityExportStrings {
  navSecurity: string;
  sectionTitle: string;
  sectionDesc: string;
  e2eeTitle: string;
  e2eeSubtitle: string;
  e2eeStatusActive: string;
  e2eeStatusInactive: string;
  e2eeZeroKnowledgeNote: string;
  masterPasswordLabel: string;
  masterPasswordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  rememberDeviceLabel: string;
  rememberDeviceDesc: string;
  enableEncryptionBtn: string;
  disableEncryptionBtn: string;
  encryptAllRepoBtn: string;
  decryptAllRepoBtn: string;
  lockSessionBtn: string;
  unlockVaultTitle: string;
  unlockVaultDesc: string;
  unlockVaultBtn: string;
  wrongPasswordError: string;
  passwordTooShortError: string;
  passwordMismatchError: string;
  exportSectionTitle: string;
  exportSectionDesc: string;
  exportAllZipTitle: string;
  exportAllZipDesc: string;
  exportAllZipBtn: string;
  exportCurrentNoteBtn: string;
  exportNoteMenuLabel: string;
  encryptedNoteBadge: string;
  lockedNoteSnippet: string;
  batchProgressEncrypting: string;
  batchProgressDecrypting: string;
  batchProgressExporting: string;
  toastEncryptionEnabled: string;
  toastEncryptionDisabled: string;
  toastNoteExported: string;
  toastVaultExported: string;
  toastVaultUnlocked: string;
  toastVaultLocked: string;
}

const SECURITY_STRINGS: Record<AppLanguage, SecurityExportStrings> = {
  es: {
    navSecurity: 'Seguridad y Exportación',
    sectionTitle: 'Privacidad, Cifrado E2EE y Exportación',
    sectionDesc: 'Protege tus notas con cifrado de conocimiento cero (AES-256-GCM) para que ni GitHub ni Microsoft puedan leerlas, y exporta tus archivos limpios cuando quieras.',
    e2eeTitle: 'Cifrado de Extremo a Extremo (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Tus notas se cifran en tu navegador antes de subirse a GitHub y se descifran al abrirlas en Webapp.',
    e2eeStatusActive: 'Cifrado AES-256-GCM Activo',
    e2eeStatusInactive: 'Desactivado (Texto plano en GitHub)',
    e2eeZeroKnowledgeNote: 'Importante: Tu Contraseña Maestra jamás se envía a ningún servidor ni a GitHub. Guárdala en un lugar seguro.',
    masterPasswordLabel: 'Contraseña Maestra de Cifrado',
    masterPasswordPlaceholder: 'Escribe tu contraseña maestra (mín. 6 caracteres)...',
    confirmPasswordLabel: 'Confirmar Contraseña Maestra',
    confirmPasswordPlaceholder: 'Repite tu contraseña maestra...',
    rememberDeviceLabel: 'Recordar llave en este navegador',
    rememberDeviceDesc: 'Desbloquea tus notas automáticamente al abrir Webapp en este dispositivo.',
    enableEncryptionBtn: 'Activar Cifrado E2EE y Proteger Notas',
    disableEncryptionBtn: 'Desactivar Cifrado y Restaurar Texto Plano en GitHub',
    encryptAllRepoBtn: 'Cifrar todas las notas en GitHub ahora',
    decryptAllRepoBtn: 'Descifrar todas las notas en GitHub',
    lockSessionBtn: 'Bloquear sesión en este navegador',
    unlockVaultTitle: 'Nota Protegida con Cifrado E2EE',
    unlockVaultDesc: 'Ingresa tu Contraseña Maestra para descifrar y abrir tus notas de forma segura en este dispositivo.',
    unlockVaultBtn: 'Descifrar y Abrir',
    wrongPasswordError: 'Contraseña maestra incorrecta. No se pudo verificar la autenticidad AES-GCM.',
    passwordTooShortError: 'La contraseña maestra debe tener al menos 6 caracteres.',
    passwordMismatchError: 'Las contraseñas no coinciden.',
    exportSectionTitle: 'Portabilidad y Exportación de Notas',
    exportSectionDesc: 'Descarga tus notas descifradas en formato Markdown (.md) original para usarlas en Obsidian, Notion o cualquier otro editor.',
    exportAllZipTitle: 'Exportar Bóveda Completa (.ZIP)',
    exportAllZipDesc: 'Descarga un archivo .ZIP con todas tus carpetas, sub-notas y archivos .md 100% descifrados y listos para abrir en Obsidian.',
    exportAllZipBtn: 'Descargar todas las notas (.ZIP)',
    exportCurrentNoteBtn: 'Exportar (.md)',
    exportNoteMenuLabel: 'Exportar nota (.md)',
    encryptedNoteBadge: 'Cifrada E2EE',
    lockedNoteSnippet: '🔒 Nota cifrada de extremo a extremo (AES-256-GCM). Haz clic para desbloquear con tu Contraseña Maestra.',
    batchProgressEncrypting: 'Cifrando notas en GitHub',
    batchProgressDecrypting: 'Descifrando notas en GitHub',
    batchProgressExporting: 'Preparando exportación descifrada',
    toastEncryptionEnabled: 'Cifrado E2EE activado y notas protegidas en GitHub',
    toastEncryptionDisabled: 'Cifrado desactivado y notas restauradas a texto plano en GitHub',
    toastNoteExported: 'Nota exportada en Markdown (.md) limpio',
    toastVaultExported: 'Bóveda exportada en .ZIP con éxito',
    toastVaultUnlocked: 'Bóveda desbloqueada correctamente',
    toastVaultLocked: 'Llave local bloqueada en este navegador',
  },
  en: {
    navSecurity: 'Security & Export',
    sectionTitle: 'Privacy, E2EE Encryption & Export',
    sectionDesc: 'Protect your notes with Zero-Knowledge encryption (AES-256-GCM) so neither GitHub nor Microsoft can read them, and export clean Markdown anytime.',
    e2eeTitle: 'End-to-End Encryption (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Your notes are encrypted in your browser before uploading to GitHub and decrypted when opened in Webapp.',
    e2eeStatusActive: 'AES-256-GCM Encryption Active',
    e2eeStatusInactive: 'Disabled (Plaintext on GitHub)',
    e2eeZeroKnowledgeNote: 'Important: Your Master Password is never sent to any server or GitHub. Keep it in a safe place.',
    masterPasswordLabel: 'Encryption Master Password',
    masterPasswordPlaceholder: 'Enter master password (min. 6 characters)...',
    confirmPasswordLabel: 'Confirm Master Password',
    confirmPasswordPlaceholder: 'Repeat your master password...',
    rememberDeviceLabel: 'Remember key in this browser',
    rememberDeviceDesc: 'Automatically unlock your notes when opening Webapp on this device.',
    enableEncryptionBtn: 'Enable E2EE & Encrypt Notes',
    disableEncryptionBtn: 'Disable E2EE & Restore Plaintext on GitHub',
    encryptAllRepoBtn: 'Encrypt all notes on GitHub now',
    decryptAllRepoBtn: 'Decrypt all notes on GitHub',
    lockSessionBtn: 'Lock session in this browser',
    unlockVaultTitle: 'E2EE Encrypted Note',
    unlockVaultDesc: 'Enter your Master Password to safely decrypt and open your notes on this device.',
    unlockVaultBtn: 'Decrypt & Open',
    wrongPasswordError: 'Incorrect Master Password. AES-GCM authentication failed.',
    passwordTooShortError: 'Master password must be at least 6 characters.',
    passwordMismatchError: 'Passwords do not match.',
    exportSectionTitle: 'Data Portability & Note Export',
    exportSectionDesc: 'Download your decrypted notes in clean Markdown (.md) format for Obsidian, Notion, or any local editor.',
    exportAllZipTitle: 'Export Complete Vault (.ZIP)',
    exportAllZipDesc: 'Download a .ZIP archive with all folders, sub-notes, and 100% decrypted .md files ready for Obsidian.',
    exportAllZipBtn: 'Download all notes (.ZIP)',
    exportCurrentNoteBtn: 'Export (.md)',
    exportNoteMenuLabel: 'Export note (.md)',
    encryptedNoteBadge: 'E2EE Encrypted',
    lockedNoteSnippet: '🔒 End-to-end encrypted note (AES-256-GCM). Click to unlock with your Master Password.',
    batchProgressEncrypting: 'Encrypting notes on GitHub',
    batchProgressDecrypting: 'Decrypting notes on GitHub',
    batchProgressExporting: 'Preparing decrypted export',
    toastEncryptionEnabled: 'E2EE encryption enabled and notes protected on GitHub',
    toastEncryptionDisabled: 'E2EE disabled and notes restored to plaintext on GitHub',
    toastNoteExported: 'Note exported as clean Markdown (.md)',
    toastVaultExported: 'Vault exported as .ZIP successfully',
    toastVaultUnlocked: 'Vault unlocked successfully',
    toastVaultLocked: 'Local key locked in this browser',
  },
  pt: {
    navSecurity: 'Segurança e Exportação',
    sectionTitle: 'Privacidade, Criptografia E2EE e Exportação',
    sectionDesc: 'Proteja suas notas com criptografia de conhecimento zero (AES-256-GCM) para que nem o GitHub nem a Microsoft possam lê-las.',
    e2eeTitle: 'Criptografia de Ponta a Ponta (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Suas notas são criptografadas no navegador antes de irem para o GitHub e descriptografadas ao abrir no Webapp.',
    e2eeStatusActive: 'Criptografia AES-256-GCM Ativa',
    e2eeStatusInactive: 'Desativada (Texto simples no GitHub)',
    e2eeZeroKnowledgeNote: 'Importante: Sua Senha Mestra nunca é enviada ao GitHub ou servidores.',
    masterPasswordLabel: 'Senha Mestra de Criptografia',
    masterPasswordPlaceholder: 'Digite sua senha mestra (mín. 6 caracteres)...',
    confirmPasswordLabel: 'Confirmar Senha Mestra',
    confirmPasswordPlaceholder: 'Repita sua senha mestra...',
    rememberDeviceLabel: 'Lembrar chave neste navegador',
    rememberDeviceDesc: 'Desbloqueia suas notas automaticamente neste dispositivo.',
    enableEncryptionBtn: 'Ativar Criptografia E2EE e Proteger Notas',
    disableEncryptionBtn: 'Desativar Criptografia e Restaurar Texto Simples',
    encryptAllRepoBtn: 'Criptografar todas as notas no GitHub agora',
    decryptAllRepoBtn: 'Descriptografar todas as notas no GitHub',
    lockSessionBtn: 'Bloquear sessão neste navegador',
    unlockVaultTitle: 'Nota Protegida com Criptografia E2EE',
    unlockVaultDesc: 'Digite sua Senha Mestra para descriptografar e abrir suas notas com segurança.',
    unlockVaultBtn: 'Descriptografar e Abrir',
    wrongPasswordError: 'Senha mestra incorreta.',
    passwordTooShortError: 'A senha mestra deve ter pelo menos 6 caracteres.',
    passwordMismatchError: 'As senhas não coincidem.',
    exportSectionTitle: 'Portabilidade e Exportação de Notas',
    exportSectionDesc: 'Baixe suas notas descriptografadas em Markdown (.md) limpo para usar no Obsidian ou outro editor.',
    exportAllZipTitle: 'Exportar Cofre Completo (.ZIP)',
    exportAllZipDesc: 'Baixe um arquivo .ZIP com todas as pastas e arquivos .md 100% descriptografados.',
    exportAllZipBtn: 'Baixar todas as notas (.ZIP)',
    exportCurrentNoteBtn: 'Exportar (.md)',
    exportNoteMenuLabel: 'Exportar nota (.md)',
    encryptedNoteBadge: 'Criptografada E2EE',
    lockedNoteSnippet: '🔒 Nota criptografada de ponta a ponta (AES-256-GCM). Clique para desbloquear.',
    batchProgressEncrypting: 'Criptografando notas no GitHub',
    batchProgressDecrypting: 'Descriptografando notas no GitHub',
    batchProgressExporting: 'Preparando exportação',
    toastEncryptionEnabled: 'Criptografia E2EE ativada com sucesso',
    toastEncryptionDisabled: 'Criptografia desativada e notas restauradas',
    toastNoteExported: 'Nota exportada em Markdown (.md)',
    toastVaultExported: 'Cofre exportado em .ZIP com sucesso',
    toastVaultUnlocked: 'Cofre desbloqueado com sucesso',
    toastVaultLocked: 'Sessão bloqueada neste navegador',
  },
  fr: {
    navSecurity: 'Sécurité et Exportation',
    sectionTitle: 'Confidentialité, Chiffrement E2EE et Exportation',
    sectionDesc: 'Protégez vos notes avec le chiffrement Zero-Knowledge (AES-256-GCM) et exportez vos fichiers Markdown à tout moment.',
    e2eeTitle: 'Chiffrement de Bout en Bout (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Vos notes sont chiffrées dans votre navigateur avant d’être envoyées sur GitHub.',
    e2eeStatusActive: 'Chiffrement AES-256-GCM Actif',
    e2eeStatusInactive: 'Désactivé (Texte brut sur GitHub)',
    e2eeZeroKnowledgeNote: 'Important : Votre mot de passe maître n’est jamais envoyé à GitHub.',
    masterPasswordLabel: 'Mot de Passe Maître',
    masterPasswordPlaceholder: 'Entrez votre mot de passe maître (min. 6 caractères)...',
    confirmPasswordLabel: 'Confirmer le Mot de Passe Maître',
    confirmPasswordPlaceholder: 'Répétez votre mot de passe maître...',
    rememberDeviceLabel: 'Mémoriser la clé dans ce navigateur',
    rememberDeviceDesc: 'Déverrouille automatiquement vos notes sur cet appareil.',
    enableEncryptionBtn: 'Activer le Chiffrement E2EE',
    disableEncryptionBtn: 'Désactiver le Chiffrement et Restaurer le Texte Brut',
    encryptAllRepoBtn: 'Chiffrer toutes les notes sur GitHub',
    decryptAllRepoBtn: 'Déchiffrer toutes les notes sur GitHub',
    lockSessionBtn: 'Verrouiller la session locale',
    unlockVaultTitle: 'Note Chiffrée E2EE',
    unlockVaultDesc: 'Entrez votre mot de passe maître pour déchiffrer et ouvrir vos notes.',
    unlockVaultBtn: 'Déchiffrer et Ouvrir',
    wrongPasswordError: 'Mot de passe maître incorrect.',
    passwordTooShortError: 'Le mot de passe doit contenir au moins 6 caractères.',
    passwordMismatchError: 'Les mots de passe ne correspondent pas.',
    exportSectionTitle: 'Portabilité et Exportation des Notes',
    exportSectionDesc: 'Téléchargez vos notes déchiffrées au format Markdown (.md) pour Obsidian ou tout autre éditeur.',
    exportAllZipTitle: 'Exporter tout le Coffre (.ZIP)',
    exportAllZipDesc: 'Téléchargez une archive .ZIP avec tous vos dossiers et fichiers .md déchiffrés.',
    exportAllZipBtn: 'Télécharger toutes les notes (.ZIP)',
    exportCurrentNoteBtn: 'Exporter (.md)',
    exportNoteMenuLabel: 'Exporter la note (.md)',
    encryptedNoteBadge: 'Chiffrée E2EE',
    lockedNoteSnippet: '🔒 Note chiffrée de bout en bout (AES-256-GCM). Cliquez pour déverrouiller.',
    batchProgressEncrypting: 'Chiffrement des notes sur GitHub',
    batchProgressDecrypting: 'Déchiffrement des notes sur GitHub',
    batchProgressExporting: 'Préparation de l’exportation',
    toastEncryptionEnabled: 'Chiffrement E2EE activé',
    toastEncryptionDisabled: 'Chiffrement désactivé et notes restaurées',
    toastNoteExported: 'Note exportée en Markdown (.md)',
    toastVaultExported: 'Coffre exporté en .ZIP avec succès',
    toastVaultUnlocked: 'Coffre déverrouillé',
    toastVaultLocked: 'Session verrouillée',
  },
  nl: {
    navSecurity: 'Beveiliging & Export',
    sectionTitle: 'Privacy, E2EE-versleuteling & Export',
    sectionDesc: 'Bescherm je notities met Zero-Knowledge versleuteling (AES-256-GCM) en exporteer schone Markdown-bestanden.',
    e2eeTitle: 'End-to-End Versleuteling (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Je notities worden in je browser versleuteld voordat ze naar GitHub worden geüpload.',
    e2eeStatusActive: 'AES-256-GCM Versleuteling Actief',
    e2eeStatusInactive: 'Uitgeschakeld (Platte tekst op GitHub)',
    e2eeZeroKnowledgeNote: 'Belangrijk: Je hoofdwachtwoord wordt nooit naar GitHub verzonden.',
    masterPasswordLabel: 'Hoofdwachtwoord',
    masterPasswordPlaceholder: 'Voer hoofdwachtwoord in (min. 6 tekens)...',
    confirmPasswordLabel: 'Bevestig Hoofdwachtwoord',
    confirmPasswordPlaceholder: 'Herhaal hoofdwachtwoord...',
    rememberDeviceLabel: 'Sleutel onthouden in deze browser',
    rememberDeviceDesc: 'Ontgrendel notities automatisch op dit apparaat.',
    enableEncryptionBtn: 'E2EE Versleuteling Inschakelen',
    disableEncryptionBtn: 'Versleuteling Uitschakelen & Platte Tekst Herstellen',
    encryptAllRepoBtn: 'Versleutel nu alle notities op GitHub',
    decryptAllRepoBtn: 'Ontsleutel alle notities op GitHub',
    lockSessionBtn: 'Sessie vergrendelen in deze browser',
    unlockVaultTitle: 'E2EE Versleutelde Notitie',
    unlockVaultDesc: 'Voer je hoofdwachtwoord in om je notities te ontsleutelen.',
    unlockVaultBtn: 'Ontsleutelen & Openen',
    wrongPasswordError: 'Onjuist hoofdwachtwoord.',
    passwordTooShortError: 'Wachtwoord moet minimaal 6 tekens bevatten.',
    passwordMismatchError: 'Wachtwoorden komen niet overeen.',
    exportSectionTitle: 'Portabiliteit & Notities Exporteren',
    exportSectionDesc: 'Download je ontsleutelde notities als Markdown (.md) voor Obsidian of andere apps.',
    exportAllZipTitle: 'Volledige Kluis Exporteren (.ZIP)',
    exportAllZipDesc: 'Download een .ZIP-bestand met alle mappen en ontsleutelde .md-bestanden.',
    exportAllZipBtn: 'Download alle notities (.ZIP)',
    exportCurrentNoteBtn: 'Exporteer (.md)',
    exportNoteMenuLabel: 'Notitie exporteren (.md)',
    encryptedNoteBadge: 'E2EE Versleuteld',
    lockedNoteSnippet: '🔒 End-to-end versleutelde notitie (AES-256-GCM). Klik om te ontgrendelen.',
    batchProgressEncrypting: 'Notities versleutelen op GitHub',
    batchProgressDecrypting: 'Notities ontsleutelen op GitHub',
    batchProgressExporting: 'Export voorbereiden',
    toastEncryptionEnabled: 'E2EE-versleuteling ingeschakeld',
    toastEncryptionDisabled: 'Versleuteling uitgeschakeld',
    toastNoteExported: 'Notitie geëxporteerd (.md)',
    toastVaultExported: 'Kluis geëxporteerd als .ZIP',
    toastVaultUnlocked: 'Kluis ontgrendeld',
    toastVaultLocked: 'Sessie vergrendeld',
  },
  it: {
    navSecurity: 'Sicurezza ed Esportazione',
    sectionTitle: 'Privacy, Crittografia E2EE ed Esportazione',
    sectionDesc: 'Proteggi le tue note con crittografia Zero-Knowledge (AES-256-GCM) ed esporta file Markdown puliti in qualsiasi momento.',
    e2eeTitle: 'Crittografia End-to-End (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Le note vengono crittografate nel browser prima di essere caricate su GitHub.',
    e2eeStatusActive: 'Crittografia AES-256-GCM Attiva',
    e2eeStatusInactive: 'Disattivata (Testo in chiaro su GitHub)',
    e2eeZeroKnowledgeNote: 'Importante: La tua Password Principale non viene mai inviata a GitHub.',
    masterPasswordLabel: 'Password Principale',
    masterPasswordPlaceholder: 'Inserisci password principale (min. 6 caratteri)...',
    confirmPasswordLabel: 'Conferma Password Principale',
    confirmPasswordPlaceholder: 'Ripeti la password principale...',
    rememberDeviceLabel: 'Ricorda chiave in questo browser',
    rememberDeviceDesc: 'Sblocca automaticamente le note su questo dispositivo.',
    enableEncryptionBtn: 'Attiva Crittografia E2EE',
    disableEncryptionBtn: 'Disattiva Crittografia e Ripristina Testo in Chiaro',
    encryptAllRepoBtn: 'Crittografa tutte le note su GitHub',
    decryptAllRepoBtn: 'Decrittografa tutte le note su GitHub',
    lockSessionBtn: 'Blocca sessione in questo browser',
    unlockVaultTitle: 'Nota Protetta con Crittografia E2EE',
    unlockVaultDesc: 'Inserisci la Password Principale per decrittografare e aprire le tue note.',
    unlockVaultBtn: 'Decrittografa e Apri',
    wrongPasswordError: 'Password principale errata.',
    passwordTooShortError: 'La password deve contenere almeno 6 caratteri.',
    passwordMismatchError: 'Le password non coincidono.',
    exportSectionTitle: 'Portabilità ed Esportazione Note',
    exportSectionDesc: 'Scarica le tue note decrittografate in formato Markdown (.md) per Obsidian o altri editor.',
    exportAllZipTitle: 'Esporta Cassaforte Completa (.ZIP)',
    exportAllZipDesc: 'Scarica un archivio .ZIP con tutte le cartelle e i file .md decrittografati.',
    exportAllZipBtn: 'Scarica tutte le note (.ZIP)',
    exportCurrentNoteBtn: 'Esporta (.md)',
    exportNoteMenuLabel: 'Esporta nota (.md)',
    encryptedNoteBadge: 'Crittografata E2EE',
    lockedNoteSnippet: '🔒 Nota crittografata end-to-end (AES-256-GCM). Clicca per sbloccare.',
    batchProgressEncrypting: 'Crittografia note su GitHub',
    batchProgressDecrypting: 'Decrittografia note su GitHub',
    batchProgressExporting: 'Preparazione esportazione',
    toastEncryptionEnabled: 'Crittografia E2EE attivata',
    toastEncryptionDisabled: 'Crittografia disattivata',
    toastNoteExported: 'Nota esportata in Markdown (.md)',
    toastVaultExported: 'Cassaforte esportata in .ZIP',
    toastVaultUnlocked: 'Cassaforte sbloccata',
    toastVaultLocked: 'Sessione bloccata',
  },
  de: {
    navSecurity: 'Sicherheit & Export',
    sectionTitle: 'Datenschutz, E2EE-Verschlüsselung & Export',
    sectionDesc: 'Schützen Sie Ihre Notizen mit Zero-Knowledge-Verschlüsselung (AES-256-GCM) und exportieren Sie jederzeit saubere Markdown-Dateien.',
    e2eeTitle: 'Ende-zu-Ende-Verschlüsselung (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Ihre Notizen werden im Browser verschlüsselt, bevor sie zu GitHub hochgeladen werden.',
    e2eeStatusActive: 'AES-256-GCM-Verschlüsselung Aktiv',
    e2eeStatusInactive: 'Deaktiviert (Klartext auf GitHub)',
    e2eeZeroKnowledgeNote: 'Wichtig: Ihr Master-Passwort wird niemals an GitHub gesendet.',
    masterPasswordLabel: 'Master-Passwort',
    masterPasswordPlaceholder: 'Master-Passwort eingeben (mind. 6 Zeichen)...',
    confirmPasswordLabel: 'Master-Passwort bestätigen',
    confirmPasswordPlaceholder: 'Master-Passwort wiederholen...',
    rememberDeviceLabel: 'Schlüssel in diesem Browser speichern',
    rememberDeviceDesc: 'Notizen auf diesem Gerät automatisch entsperren.',
    enableEncryptionBtn: 'E2EE-Verschlüsselung aktivieren',
    disableEncryptionBtn: 'Verschlüsselung deaktivieren & Klartext wiederherstellen',
    encryptAllRepoBtn: 'Alle Notizen auf GitHub jetzt verschlüsseln',
    decryptAllRepoBtn: 'Alle Notizen auf GitHub entschlüsseln',
    lockSessionBtn: 'Sitzung in diesem Browser sperren',
    unlockVaultTitle: 'E2EE-verschlüsselte Notiz',
    unlockVaultDesc: 'Geben Sie Ihr Master-Passwort ein, um Ihre Notizen zu entschlüsseln.',
    unlockVaultBtn: 'Entschlüsseln & Öffnen',
    wrongPasswordError: 'Falsches Master-Passwort.',
    passwordTooShortError: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    passwordMismatchError: 'Passwörter stimmen nicht überein.',
    exportSectionTitle: 'Portabilität & Notizen-Export',
    exportSectionDesc: 'Laden Sie Ihre entschlüsselten Notizen als Markdown (.md) für Obsidian oder andere Editoren herunter.',
    exportAllZipTitle: 'Gesamten Tresor exportieren (.ZIP)',
    exportAllZipDesc: 'Laden Sie ein .ZIP-Archiv mit allen Ordnern und entschlüsselten .md-Dateien herunter.',
    exportAllZipBtn: 'Alle Notizen herunterladen (.ZIP)',
    exportCurrentNoteBtn: 'Exportieren (.md)',
    exportNoteMenuLabel: 'Notiz exportieren (.md)',
    encryptedNoteBadge: 'E2EE-verschlüsselt',
    lockedNoteSnippet: '🔒 Ende-zu-Ende-verschlüsselte Notiz (AES-256-GCM). Zum Entsperren klicken.',
    batchProgressEncrypting: 'Verschlüssele Notizen auf GitHub',
    batchProgressDecrypting: 'Entschlüssele Notizen auf GitHub',
    batchProgressExporting: 'Bereite Export vor',
    toastEncryptionEnabled: 'E2EE-Verschlüsselung aktiviert',
    toastEncryptionDisabled: 'Verschlüsselung deaktiviert',
    toastNoteExported: 'Notiz als Markdown (.md) exportiert',
    toastVaultExported: 'Tresor als .ZIP exportiert',
    toastVaultUnlocked: 'Tresor entsperrt',
    toastVaultLocked: 'Sitzung gesperrt',
  },
  ja: {
    navSecurity: 'セキュリティとエクスポート',
    sectionTitle: 'プライバシー、E2EE暗号化とエクスポート',
    sectionDesc: 'ゼロ知識暗号化（AES-256-GCM）でノートを保護し、いつでも復号済みのMarkdownファイルをエクスポートできます。',
    e2eeTitle: 'エンドツーエンド暗号化 (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'ノートはGitHubに送信される前にブラウザ内で暗号化されます。',
    e2eeStatusActive: 'AES-256-GCM 暗号化が有効',
    e2eeStatusInactive: '無効（GitHub上でプレーンテキスト）',
    e2eeZeroKnowledgeNote: '重要：マスターパスワードはGitHubやサーバーには一切送信されません。',
    masterPasswordLabel: 'マスターパスワード',
    masterPasswordPlaceholder: 'マスターパスワードを入力（6文字以上）...',
    confirmPasswordLabel: 'マスターパスワードの確認',
    confirmPasswordPlaceholder: 'マスターパスワードを再入力...',
    rememberDeviceLabel: 'このブラウザに鍵を記憶する',
    rememberDeviceDesc: 'このデバイスでWebappを開いたときに自動的にロックを解除します。',
    enableEncryptionBtn: 'E2EE暗号化を有効にしてノートを保護',
    disableEncryptionBtn: '暗号化を無効にしてGitHub上で平文に戻す',
    encryptAllRepoBtn: 'GitHub上のすべてのノートを今すぐ暗号化',
    decryptAllRepoBtn: 'GitHub上のすべてのノートを復号化',
    lockSessionBtn: 'このブラウザのセッションをロック',
    unlockVaultTitle: 'E2EE暗号化されたノート',
    unlockVaultDesc: 'マスターパスワードを入力してノートを復号化して開きます。',
    unlockVaultBtn: '復号化して開く',
    wrongPasswordError: 'マスターパスワードが正しくありません。',
    passwordTooShortError: 'パスワードは6文字以上である必要があります。',
    passwordMismatchError: 'パスワードが一致しません。',
    exportSectionTitle: 'データのポータビリティとエクスポート',
    exportSectionDesc: 'Obsidianや他のエディタ向けに、復号済みのMarkdown (.md) ファイルをダウンロードします。',
    exportAllZipTitle: 'すべてのノートを一括エクスポート (.ZIP)',
    exportAllZipDesc: 'フォルダ構造を維持したまま復号済みの全 .md ファイルを .ZIP でダウンロードします。',
    exportAllZipBtn: 'すべてのノートをダウンロード (.ZIP)',
    exportCurrentNoteBtn: 'エクスポート (.md)',
    exportNoteMenuLabel: 'ノートをエクスポート (.md)',
    encryptedNoteBadge: 'E2EE暗号化',
    lockedNoteSnippet: '🔒 エンドツーエンド暗号化ノート (AES-256-GCM)。クリックしてロック解除。',
    batchProgressEncrypting: 'GitHub上のノートを暗号化中',
    batchProgressDecrypting: 'GitHub上のノートを復号化中',
    batchProgressExporting: 'エクスポートを準備中',
    toastEncryptionEnabled: 'E2EE暗号化を有効にしました',
    toastEncryptionDisabled: '暗号化を無効にしました',
    toastNoteExported: 'Markdown (.md) をエクスポートしました',
    toastVaultExported: 'ZIPアーカイブをエクスポートしました',
    toastVaultUnlocked: 'ロックを解除しました',
    toastVaultLocked: 'セッションをロックしました',
  },
  zh: {
    navSecurity: '安全与导出',
    sectionTitle: '隐私、端到端加密 (E2EE) 与导出',
    sectionDesc: '使用零知识加密 (AES-256-GCM) 保护您的笔记，连 GitHub 和微软也无法读取，并可随时导出纯文本 Markdown。',
    e2eeTitle: '端到端加密 (Zero-Knowledge E2EE)',
    e2eeSubtitle: '笔记在上传到 GitHub 之前会在浏览器本地完成加密，打开时自动解密。',
    e2eeStatusActive: 'AES-256-GCM 加密已启用',
    e2eeStatusInactive: '未启用（GitHub 上为明文）',
    e2eeZeroKnowledgeNote: '重要提示：您的主密码绝不会发送到任何服务器或 GitHub，请妥善保管。',
    masterPasswordLabel: '加密主密码',
    masterPasswordPlaceholder: '输入主密码（至少 6 个字符）...',
    confirmPasswordLabel: '确认主密码',
    confirmPasswordPlaceholder: '再次输入主密码...',
    rememberDeviceLabel: '在此浏览器中记住密钥',
    rememberDeviceDesc: '在此设备上打开 Webapp 时自动解锁您的笔记。',
    enableEncryptionBtn: '启用 E2EE 加密并保护笔记',
    disableEncryptionBtn: '停用加密并在 GitHub 上恢复明文',
    encryptAllRepoBtn: '立即加密 GitHub 上的所有笔记',
    decryptAllRepoBtn: '解密 GitHub 上的所有笔记',
    lockSessionBtn: '在此浏览器中锁定会话',
    unlockVaultTitle: '受 E2EE 加密保护的笔记',
    unlockVaultDesc: '请输入您的主密码以安全解密并打开笔记。',
    unlockVaultBtn: '解密并打开',
    wrongPasswordError: '主密码错误，AES-GCM 验证失败。',
    passwordTooShortError: '主密码至少需要 6 个字符。',
    passwordMismatchError: '两次输入的密码不一致。',
    exportSectionTitle: '数据迁移与笔记导出',
    exportSectionDesc: '下载已解密的原始 Markdown (.md) 笔记，直接用于 Obsidian、Notion 或任何编辑器。',
    exportAllZipTitle: '导出完整笔记库 (.ZIP)',
    exportAllZipDesc: '下载包含所有文件夹、子笔记及 100% 解密 .md 文件的 .ZIP 压缩包，可直接作为 Obsidian 库打开。',
    exportAllZipBtn: '下载所有笔记 (.ZIP)',
    exportCurrentNoteBtn: '导出 (.md)',
    exportNoteMenuLabel: '导出笔记 (.md)',
    encryptedNoteBadge: 'E2EE 已加密',
    lockedNoteSnippet: '🔒 端到端加密笔记 (AES-256-GCM)。点击输入主密码解锁。',
    batchProgressEncrypting: '正在加密 GitHub 笔记',
    batchProgressDecrypting: '正在解密 GitHub 笔记',
    batchProgressExporting: '正在准备导出文件',
    toastEncryptionEnabled: 'E2EE 加密已启用，GitHub 笔记已受保护',
    toastEncryptionDisabled: '已停用加密并恢复 GitHub 明文笔记',
    toastNoteExported: '已导出干净的 Markdown (.md) 笔记',
    toastVaultExported: '完整笔记库已成功导出为 .ZIP',
    toastVaultUnlocked: '笔记库已成功解锁',
    toastVaultLocked: '本地密钥已锁定',
  },
  ru: {
    navSecurity: 'Безопасность и экспорт',
    sectionTitle: 'Приватность, E2EE-шифрование и экспорт',
    sectionDesc: 'Защитите заметки сквозным шифрованием с нулевым разглашением (AES-256-GCM) и экспортируйте чистые файлы Markdown в любое время.',
    e2eeTitle: 'Сквозное шифрование (Zero-Knowledge E2EE)',
    e2eeSubtitle: 'Заметки шифруются в браузере перед отправкой в GitHub и расшифровываются при открытии.',
    e2eeStatusActive: 'Шифрование AES-256-GCM активно',
    e2eeStatusInactive: 'Отключено (Открытый текст на GitHub)',
    e2eeZeroKnowledgeNote: 'Важно: ваш мастер-пароль никогда не передается на серверы или в GitHub.',
    masterPasswordLabel: 'Мастер-пароль шифрования',
    masterPasswordPlaceholder: 'Введите мастер-пароль (мин. 6 символов)...',
    confirmPasswordLabel: 'Подтвердите мастер-пароль',
    confirmPasswordPlaceholder: 'Повторите мастер-пароль...',
    rememberDeviceLabel: 'Запомнить ключ в этом браузере',
    rememberDeviceDesc: 'Автоматически разблокировать заметки на этом устройстве.',
    enableEncryptionBtn: 'Включить E2EE и зашифровать заметки',
    disableEncryptionBtn: 'Отключить шифрование и вернуть открытый текст',
    encryptAllRepoBtn: 'Зашифровать все заметки на GitHub сейчас',
    decryptAllRepoBtn: 'Расшифровать все заметки на GitHub',
    lockSessionBtn: 'Заблокировать сессию в браузере',
    unlockVaultTitle: 'Заметка защищена E2EE',
    unlockVaultDesc: 'Введите мастер-пароль для расшифровки и открытия ваших заметок.',
    unlockVaultBtn: 'Расшифровать и открыть',
    wrongPasswordError: 'Неверный мастер-пароль.',
    passwordTooShortError: 'Пароль должен содержать минимум 6 символов.',
    passwordMismatchError: 'Пароли не совпадают.',
    exportSectionTitle: 'Портативность и экспорт заметок',
    exportSectionDesc: 'Скачивайте расшифрованные заметки в формате Markdown (.md) для Obsidian или других редакторов.',
    exportAllZipTitle: 'Экспортировать все хранилище (.ZIP)',
    exportAllZipDesc: 'Скачать .ZIP-архив со всеми папками и 100% расшифрованными файлами .md.',
    exportAllZipBtn: 'Скачать все заметки (.ZIP)',
    exportCurrentNoteBtn: 'Экспорт (.md)',
    exportNoteMenuLabel: 'Экспортировать заметку (.md)',
    encryptedNoteBadge: 'E2EE Зашифровано',
    lockedNoteSnippet: '🔒 Заметка зашифрована (AES-256-GCM). Нажмите для разблокировки.',
    batchProgressEncrypting: 'Шифрование заметок на GitHub',
    batchProgressDecrypting: 'Расшифровка заметок на GitHub',
    batchProgressExporting: 'Подготовка экспорта',
    toastEncryptionEnabled: 'E2EE-шифрование включено',
    toastEncryptionDisabled: 'Шифрование отключено',
    toastNoteExported: 'Заметка экспортирована (.md)',
    toastVaultExported: 'Хранилище экспортировано в .ZIP',
    toastVaultUnlocked: 'Хранилище разблокировано',
    toastVaultLocked: 'Сессия заблокирована',
  },
};

export function getSecurityStrings(lang?: AppLanguage | string): SecurityExportStrings {
  if (lang && isSupportedLanguage(lang)) {
    return SECURITY_STRINGS[lang];
  }
  return SECURITY_STRINGS.es;
}
