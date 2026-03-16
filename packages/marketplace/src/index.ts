/**
 * Waggle Marketplace — Main Entry Point
 * 
 * @module @waggle/marketplace
 * 
 * Provides:
 *   - MarketplaceDB: SQLite database access for the package catalog
 *   - MarketplaceInstaller: Install/uninstall skills, plugins, MCP servers
 *   - MarketplaceSync: Sync packages from live marketplace sources
 * 
 * Usage:
 *   import { MarketplaceDB, MarketplaceInstaller, MarketplaceSync } from '@waggle/marketplace';
 *   
 *   const db = new MarketplaceDB();
 *   const installer = new MarketplaceInstaller(db);
 *   
 *   // Search and install
 *   const results = db.search({ query: 'code review', type: 'skill' });
 *   await installer.install({ packageId: results.packages[0].id });
 *   
 *   // Install a pack
 *   await installer.installPack('research_analyst');
 *   
 *   // Sync from live sources
 *   const sync = new MarketplaceSync(db);
 *   await sync.syncAll();
 */

export { MarketplaceDB } from './db';
export { MarketplaceInstaller } from './installer';
export { MarketplaceSync } from './sync';
export { SecurityGate } from './security';

export type {
  MarketplaceSource,
  MarketplacePackage,
  MarketplacePack,
  Installation,
  InstallManifest,
  PluginManifest,
  McpServerConfig,
  SettingField,
  PostInstallHook,
  InstallationType,
  InstallRequest,
  InstallResult,
  PackInstallResult,
  SearchOptions,
  SearchResult,
  SyncOptions,
  SyncResult,
} from './types';

export type {
  Severity,
  SecurityFinding,
  SecurityCategory,
  SecurityEngine,
  ScanResult,
  SecurityGateConfig,
} from './security';
