import { Plugin, WorkspaceLeaf, View } from "obsidian";
import { DEFAULT_SETTINGS, PiiSettings, PiiSettingTab } from "./src/settings";
import { registerCommands } from "./src/commands";
import { VIEW_TYPE_PII, PiiSidebarView } from "./ui/PiiSidebarView";

export default class PiiLockPlugin extends Plugin {
  settings: PiiSettings;

  /* ──────────── Lifecycle ──────────── */
  async onload() {
    await this.loadSettings();

    // Register the sidebar view with proper type casting
    this.registerView(
      VIEW_TYPE_PII,
      (leaf: WorkspaceLeaf) => (new PiiSidebarView(leaf, this) as unknown) as View
    );

    // shield icon – sidebar toggle
    this.addRibbonIcon("shield", "Lock and Find", () => this.activateSidebar());

    // settings tab + commands
    this.addSettingTab(new PiiSettingTab(this.app, this));
    registerCommands(this);
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_PII);
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
