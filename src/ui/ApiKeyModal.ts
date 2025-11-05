// src/ui/ApiKeyModal.ts
import { App, Modal, Notice, Setting } from "obsidian";
import type PiiLockPlugin from "../../main";
import type { KeyInfo } from "../api/types";

/**
 * Modal for managing API keys
 */
export class ApiKeyModal extends Modal {
  private keysList: HTMLElement;

  constructor(app: App, private plugin: PiiLockPlugin) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");

    // Title
    contentEl.createEl("h2", { text: "API key management" });

    // Description
    contentEl.createEl("p", {
      text: "Generate and manage API keys for external access to Lock & Find",
      cls: "pii-modal-description",
    });

    // Generate new key button
    new Setting(contentEl)
      .setName("Generate new API key")
      .setDesc("Create a new API key for authentication")
      .addButton((btn) =>
        btn
          .setButtonText("Generate key")
          .setCta()
          .onClick(async () => {
            await this.generateNewKey();
          })
      );

    contentEl.createEl("hr");

    // Keys list
    contentEl.createEl("h3", { text: "Existing API keys" });
    this.keysList = contentEl.createDiv("pii-keys-list");

    this.renderKeys();

    // Close button
    const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
    buttonContainer
      .createEl("button", { text: "Close", cls: "pii-btn-primary" })
      .onclick = () => this.close();
  }

  private renderKeys(): void {
    this.keysList.empty();

    const apiServer = this.plugin.getApiServer();
    if (!apiServer) {
      this.keysList.createEl("p", {
        text: "API server not initialized",
        cls: "pii-text-muted",
      });
      return;
    }

    const keys = apiServer.getKeyManager().listKeys();

    if (keys.length === 0) {
      this.keysList.createEl("p", {
        text: "No API keys created yet",
        cls: "pii-text-muted",
      });
      return;
    }

    keys.forEach((key) => {
      const keyItem = this.keysList.createDiv("pii-key-item");

      // Key info
      const keyInfo = keyItem.createDiv("pii-key-info");
      keyInfo.createEl("strong", { text: key.name });
      keyInfo.createEl("div", {
        text: `Created: ${new Date(key.createdAt).toLocaleString()}`,
        cls: "pii-text-small",
      });
      if (key.lastUsed) {
        keyInfo.createEl("div", {
          text: `Last used: ${new Date(key.lastUsed).toLocaleString()}`,
          cls: "pii-text-small",
        });
      }
      keyInfo.createEl("div", {
        text: `Usage count: ${key.usageCount}`,
        cls: "pii-text-small",
      });

      // Status badge
      keyItem.createEl("span", {
        cls: key.enabled ? "pii-status-active" : "pii-status-inactive",
        text: key.enabled ? "Active" : "Revoked",
      });

      // Actions
      const actions = keyItem.createDiv("pii-key-actions");

      if (key.enabled) {
        // Revoke button
        const revokeBtn = actions.createEl("button", {
          text: "Revoke",
          cls: "pii-btn-warning",
        });
        revokeBtn.onclick = async () => {
          await this.revokeKey(key);
        };
      }

      // Delete button
      const deleteBtn = actions.createEl("button", {
        text: "Delete",
        cls: "pii-btn-danger",
      });
      deleteBtn.onclick = async () => {
        await this.deleteKey(key);
      };
    });
  }

  private async generateNewKey(): Promise<void> {
    const apiServer = this.plugin.getApiServer();
    if (!apiServer) {
      new Notice("API server not initialized");
      return;
    }

    // Prompt for key name
    const name = await this.promptForKeyName();
    if (!name) return;

    try {
      const rawKey = await apiServer.getKeyManager().generateKey(name);

      // Save settings
      this.plugin.settings.apiKeys = apiServer.getKeyManager().serializeKeys();
      await this.plugin.saveSettings();

      // Show the key to the user (only time it's visible)
      this.showKeyModal(rawKey, name);

      // Refresh the list
      this.renderKeys();

      new Notice(`API key "${name}" generated successfully`);
    } catch (error) {
      console.error("Failed to generate API key:", error);
      new Notice("Failed to generate API key");
    }
  }

  private async revokeKey(key: KeyInfo): Promise<void> {
    const apiServer = this.plugin.getApiServer();
    if (!apiServer) return;

    const confirmed = await this.confirmAction(
      `Are you sure you want to revoke the key "${key.name}"? It will no longer be usable.`
    );
    if (!confirmed) return;

    try {
      await apiServer.getKeyManager().revokeKey(key.id);

      // Save settings
      this.plugin.settings.apiKeys = apiServer.getKeyManager().serializeKeys();
      await this.plugin.saveSettings();

      this.renderKeys();
      new Notice(`API key "${key.name}" revoked`);
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      new Notice("Failed to revoke API key");
    }
  }

  private async deleteKey(key: KeyInfo): Promise<void> {
    const apiServer = this.plugin.getApiServer();
    if (!apiServer) return;

    const confirmed = await this.confirmAction(
      `Are you sure you want to permanently delete the key "${key.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await apiServer.getKeyManager().deleteKey(key.id);

      // Save settings
      this.plugin.settings.apiKeys = apiServer.getKeyManager().serializeKeys();
      await this.plugin.saveSettings();

      this.renderKeys();
      new Notice(`API key "${key.name}" deleted`);
    } catch (error) {
      console.error("Failed to delete API key:", error);
      new Notice("Failed to delete API key");
    }
  }

  private async promptForKeyName(): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new KeyNameModal(this.app, (name) => resolve(name));
      modal.open();
    });
  }

  private showKeyModal(key: string, name: string): void {
    new KeyDisplayModal(this.app, key, name).open();
  }

  private async confirmAction(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new ConfirmModal(this.app, message, (confirmed) =>
        resolve(confirmed)
      );
      modal.open();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * Modal for entering key name
 */
class KeyNameModal extends Modal {
  private nameInput: HTMLInputElement;

  constructor(app: App, private onSubmit: (name: string | null) => void) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");

    contentEl.createEl("h3", { text: "Enter key name" });
    contentEl.createEl("p", {
      text: "Give this API key a descriptive name",
      cls: "pii-modal-description",
    });

    this.nameInput = contentEl.createEl("input", {
      type: "text",
      placeholder: "e.g., Desktop App, Mobile Device",
      cls: "pii-input-full",
    });
    this.nameInput.focus();

    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.submit();
      } else if (e.key === "Escape") {
        this.close();
      }
    });

    const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
    buttonContainer
      .createEl("button", { text: "Cancel", cls: "pii-btn-secondary" })
      .onclick = () => {
        this.onSubmit(null);
        this.close();
      };
    buttonContainer
      .createEl("button", { text: "Create", cls: "pii-btn-primary" })
      .onclick = () => this.submit();
  }

  private submit(): void {
    const name = this.nameInput.value.trim();
    if (!name) {
      new Notice("Please enter a key name");
      return;
    }
    this.onSubmit(name);
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * Modal for displaying generated API key
 */
class KeyDisplayModal extends Modal {
  constructor(app: App, private key: string, private name: string) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");

    contentEl.createEl("h3", { text: "API key generated" });

    contentEl.createEl("p", {
      text: `Your API key "${this.name}" has been generated. Copy it now - you won't be able to see it again!`,
      cls: "pii-warning-text",
    });

    const keyContainer = contentEl.createDiv("pii-key-display");
    keyContainer.createEl("code", {
      text: this.key,
      cls: "pii-key-text",
    });

    const copyBtn = keyContainer.createEl("button", {
      text: "Copy",
      cls: "pii-btn-primary",
    });
    copyBtn.onclick = async () => {
      await navigator.clipboard.writeText(this.key);
      new Notice("API key copied to clipboard");
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 2000);
    };

    const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
    buttonContainer
      .createEl("button", { text: "Close", cls: "pii-btn-primary" })
      .onclick = () => this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * Modal for confirmation dialogs
 */
class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private onConfirm: (confirmed: boolean) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");

    contentEl.createEl("h3", { text: "Confirm action" });
    contentEl.createEl("p", { text: this.message });

    const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
    buttonContainer
      .createEl("button", { text: "Cancel", cls: "pii-btn-secondary" })
      .onclick = () => {
        this.onConfirm(false);
        this.close();
      };
    buttonContainer
      .createEl("button", { text: "Confirm", cls: "pii-btn-warning" })
      .onclick = () => {
        this.onConfirm(true);
        this.close();
      };
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
