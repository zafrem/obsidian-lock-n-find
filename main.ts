import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, PiiSettings, PiiSettingTab } from "./src/settings";
import { registerCommands } from "./src/commands";
import { VIEW_TYPE_PII, LnFSidebarView } from "./ui/LnFSidebarView";
import { LnFApiServer } from "./src/api/server";

export default class PiiLockPlugin extends Plugin {
  settings: PiiSettings;
  private apiServer: LnFApiServer | null = null;

  /* ──────────── Lifecycle ──────────── */
  async onload() {
    await this.loadSettings();

    // Initialize API server
    this.apiServer = new LnFApiServer(this.app, this);

    // Start API server if enabled
    if (this.settings.api.enabled) {
      this.startApiServer();
    }

    // Register the sidebar view
    this.registerView(
      VIEW_TYPE_PII,
      (leaf: WorkspaceLeaf) => new LnFSidebarView(leaf, this)
    );

    // shield icon – sidebar toggle
    this.addRibbonIcon("shield", "Lock and find", () => this.activateSidebar());

    // settings tab + commands
    this.addSettingTab(new PiiSettingTab(this.app, this));
    registerCommands(this);
  }

  onunload() {
    // Stop API server if running
    if (this.apiServer) {
      this.stopApiServer();
    }

    // Don't detach leaves in onunload - this is an antipattern
    // The workspace handles cleanup automatically
  }

  /* ──────────── Helpers ──────────── */
  private async activateSidebar() {
    // Focus if already open, otherwise create new leaf
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PII);

    if (leaves.length > 0) {
      // If a leaf with our view already exists, reveal it
      await this.app.workspace.revealLeaf(leaves[0]);
      return;
    }

    // Otherwise create a new leaf in the left sidebar
    const leaf = this.app.workspace.getLeftLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_PII,
      active: true,
    });

    await this.app.workspace.revealLeaf(leaf);
  }

  private async loadSettings() {
    const saved = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /* ──────────── API Server Methods ──────────── */
  startApiServer(): void {
    if (!this.apiServer) {
      console.error("API server not initialized");
      return;
    }
    this.apiServer.start(this.settings.api);
  }

  stopApiServer(): void {
    if (!this.apiServer) {
      return;
    }
    this.apiServer.stop();
  }

  getApiServer(): LnFApiServer | null {
    return this.apiServer;
  }
}
