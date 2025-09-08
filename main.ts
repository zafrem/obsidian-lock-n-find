import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, PiiSettings, PiiSettingTab } from "./src/settings";
import { registerCommands } from "./src/commands";
import { VIEW_TYPE_PII, LnFSidebarView } from "./ui/LnFSidebarView";

export default class PiiLockPlugin extends Plugin {
  settings: PiiSettings;

  /* ──────────── Lifecycle ──────────── */
  async onload() {
    await this.loadSettings();

    // Register the sidebar view
    this.registerView(
      VIEW_TYPE_PII,
      (leaf: WorkspaceLeaf) => new LnFSidebarView(leaf, this)
    );

    // shield icon – sidebar toggle
    this.addRibbonIcon("shield", "Lock and Find", () => this.activateSidebar());

    // settings tab + commands
    this.addSettingTab(new PiiSettingTab(this.app, this));
    registerCommands(this);
  }

  onunload() {
    // Don't detach leaves in onunload - this is an antipattern
    // The workspace handles cleanup automatically
  }

  /* ──────────── Helpers ──────────── */
  private async activateSidebar() {
    // Focus if already open, otherwise create new leaf
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PII);
    
    if (leaves.length > 0) {
      // If a leaf with our view already exists, reveal it
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }
    
    // Otherwise create a new leaf in the left sidebar
    const leaf = this.app.workspace.getLeftLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_PII,
      active: true,
    });
    
    this.app.workspace.revealLeaf(leaf);
  }

  private async loadSettings() {
    const saved = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
