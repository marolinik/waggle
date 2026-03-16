/**
 * VaultStore — encrypted local secrets store.
 *
 * Encrypts secrets using AES-256-GCM (Node.js built-in crypto).
 * Stores encrypted data in vault.json with a machine-local key file.
 * Each entry is independently encrypted so individual secrets can be
 * updated without re-encrypting everything.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export interface VaultEntry {
  name: string;
  value: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

interface VaultRecord {
  encrypted: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export class VaultStore {
  private dataDir: string;
  private vaultPath: string;
  private keyPath: string;
  private encryptionKey: Buffer;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.vaultPath = path.join(dataDir, 'vault.json');
    this.keyPath = path.join(dataDir, '.vault-key');

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.encryptionKey = this.ensureKey();
  }

  /** Ensure the encryption key exists. Generate if missing. */
  private ensureKey(): Buffer {
    if (fs.existsSync(this.keyPath)) {
      return Buffer.from(fs.readFileSync(this.keyPath, 'utf-8').trim(), 'hex');
    }
    const key = crypto.randomBytes(KEY_LENGTH);
    fs.writeFileSync(this.keyPath, key.toString('hex'), { mode: 0o600 });
    return key;
  }

  /** Encrypt a plaintext string. Returns iv:authTag:ciphertext (all hex). */
  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /** Decrypt an encoded string (iv:authTag:ciphertext, all hex). */
  private decrypt(encoded: string): string {
    const [ivHex, authTagHex, ciphertextHex] = encoded.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf-8');
  }

  /** Read the vault file (encrypted entries). */
  private readVault(): Record<string, VaultRecord> {
    if (!fs.existsSync(this.vaultPath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
    } catch {
      return {};
    }
  }

  /** Write the vault file. */
  private writeVault(vault: Record<string, VaultRecord>): void {
    fs.writeFileSync(this.vaultPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
  }

  /** Set a secret (encrypts value, stores metadata alongside). */
  set(name: string, value: string, metadata?: Record<string, unknown>): void {
    const vault = this.readVault();
    vault[name] = {
      encrypted: this.encrypt(value),
      metadata,
      updatedAt: new Date().toISOString(),
    };
    this.writeVault(vault);
  }

  /** Get a decrypted secret by name. Returns null if not found or decryption fails. */
  get(name: string): VaultEntry | null {
    const vault = this.readVault();
    const entry = vault[name];
    if (!entry) return null;
    try {
      return {
        name,
        value: this.decrypt(entry.encrypted),
        metadata: entry.metadata,
        updatedAt: entry.updatedAt,
      };
    } catch {
      return null; // Decryption failed (key mismatch, corrupted)
    }
  }

  /** Delete a secret. Returns true if it existed. */
  delete(name: string): boolean {
    const vault = this.readVault();
    if (!vault[name]) return false;
    delete vault[name];
    this.writeVault(vault);
    return true;
  }

  /** List secret names (without values). */
  list(): Array<{ name: string; metadata?: Record<string, unknown>; updatedAt: string }> {
    const vault = this.readVault();
    return Object.entries(vault).map(([name, entry]) => ({
      name,
      metadata: entry.metadata,
      updatedAt: entry.updatedAt,
    }));
  }

  /** Check if a secret exists. */
  has(name: string): boolean {
    const vault = this.readVault();
    return name in vault;
  }

  /** Set a connector credential with typed metadata */
  setConnectorCredential(connectorId: string, credential: {
    type: 'api_key' | 'oauth2' | 'bearer' | 'basic';
    value: string;
    refreshToken?: string;
    expiresAt?: string;
    scopes?: string[];
  }): void {
    this.set(`connector:${connectorId}`, credential.value, {
      credentialType: credential.type,
      refreshToken: credential.refreshToken,
      expiresAt: credential.expiresAt,
      scopes: credential.scopes,
    });
  }

  /** Get a connector credential with typed metadata */
  getConnectorCredential(connectorId: string): {
    value: string;
    type: string;
    refreshToken?: string;
    expiresAt?: string;
    scopes?: string[];
    isExpired: boolean;
  } | null {
    const entry = this.get(`connector:${connectorId}`);
    if (!entry) return null;
    const expiresAt = entry.metadata?.expiresAt as string | undefined;
    return {
      value: entry.value,
      type: (entry.metadata?.credentialType as string) ?? 'api_key',
      refreshToken: entry.metadata?.refreshToken as string | undefined,
      expiresAt,
      scopes: entry.metadata?.scopes as string[] | undefined,
      isExpired: expiresAt ? new Date(expiresAt) < new Date() : false,
    };
  }

  /** Migrate plaintext providers from config.json to vault. Returns count migrated. */
  migrateFromConfig(config: { providers?: Record<string, { apiKey: string; models?: string[]; baseUrl?: string }> }): number {
    if (!config.providers) return 0;
    let migrated = 0;
    for (const [name, provider] of Object.entries(config.providers)) {
      if (provider.apiKey && !this.has(name)) {
        this.set(name, provider.apiKey, {
          models: provider.models,
          baseUrl: provider.baseUrl,
        });
        migrated++;
      }
    }
    return migrated;
  }
}
