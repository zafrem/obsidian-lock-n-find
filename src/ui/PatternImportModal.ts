// src/ui/PatternImportModal.ts
import { App, Modal, Notice, Setting } from "obsidian";
import type PiiLockPlugin from "../../main";
import {
  importFromJSON,
  importFromTextFile,
  importFromURL,
  importFromCSV,
  importFromMarkdown,
  exportToJSON,
  type ExternalPattern
} from "../externalPatterns";

export class PatternImportModal extends Modal {
  constructor(
    app: App,
    private plugin: PiiLockPlugin,
    private onImport: (patterns: ExternalPattern[]) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");

    contentEl.createEl("h2", { text: "Import Patterns" });

    // Method 1: From File in Vault
    new Setting(contentEl)
      .setName("Import from File")
      .setDesc("Import from JSON, CSV, TXT, or MD file in your vault")
      .addText((text) => {
        text.setPlaceholder("path/to/patterns.json");
        text.inputEl.id = "file-path-input";
      })
      .addButton((btn) =>
        btn
          .setButtonText("Import")
          .setCta()
          .onClick(async () => {
            const input = document.getElementById("file-path-input") as HTMLInputElement;
            const filePath = input.value.trim();

            if (!filePath) {
              new Notice("Please enter a file path");
              return;
            }

            let patterns: ExternalPattern[] = [];

            if (filePath.endsWith('.json')) {
              patterns = await importFromJSON(this.app, filePath);
            } else if (filePath.endsWith('.csv')) {
              patterns = await importFromCSV(this.app, filePath);
            } else if (filePath.endsWith('.txt')) {
              patterns = await importFromTextFile(this.app, filePath);
            } else if (filePath.endsWith('.md')) {
              patterns = await importFromMarkdown(this.app, filePath);
            } else {
              new Notice("Unsupported file type. Use .json, .csv, .txt, or .md");
              return;
            }

            if (patterns.length > 0) {
              this.onImport(patterns);
              this.close();
            }
          })
      );

    contentEl.createEl("hr");

    // Method 2: From URL
    new Setting(contentEl)
      .setName("Import from URL")
      .setDesc("Download patterns from a remote JSON file")
      .addText((text) => {
        text.setPlaceholder("https://example.com/patterns.json");
        text.inputEl.id = "url-input";
        text.inputEl.style.width = "100%";
      })
      .addButton((btn) =>
        btn
          .setButtonText("Download")
          .setCta()
          .onClick(async () => {
            const input = document.getElementById("url-input") as HTMLInputElement;
            const url = input.value.trim();

            if (!url) {
              new Notice("Please enter a URL");
              return;
            }

            const patterns = await importFromURL(url);
            if (patterns.length > 0) {
              this.onImport(patterns);
              this.close();
            }
          })
      );

    contentEl.createEl("hr");

    // Method 3: From GitHub Gist
    new Setting(contentEl)
      .setName("Import from GitHub Gist")
      .setDesc("Load patterns from a public Gist")
      .addText((text) => {
        text.setPlaceholder("Gist ID (e.g., abc123...)");
        text.inputEl.id = "gist-input";
      })
      .addButton((btn) =>
        btn
          .setButtonText("Import")
          .setCta()
          .onClick(async () => {
            const input = document.getElementById("gist-input") as HTMLInputElement;
            const gistId = input.value.trim();

            if (!gistId) {
              new Notice("Please enter a Gist ID");
              return;
            }

            const url = `https://gist.githubusercontent.com/raw/${gistId}/patterns.json`;
            const patterns = await importFromURL(url);

            if (patterns.length > 0) {
              this.onImport(patterns);
              this.close();
            }
          })
      );

    contentEl.createEl("hr");

    // Method 4: Paste JSON
    contentEl.createEl("h3", { text: "Or Paste JSON" });

    const textarea = contentEl.createEl("textarea", {
      attr: {
        rows: "10",
        placeholder: `[\n  {\n    "name": "Pattern Name",\n    "regex": "\\\\d+",\n    "description": "Description"\n  }\n]`
      }
    });
    textarea.style.width = "100%";
    textarea.style.fontFamily = "monospace";

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Import from Clipboard")
          .setCta()
          .onClick(async () => {
            try {
              const json = textarea.value || (await navigator.clipboard.readText());
              const patterns = JSON.parse(json);

              if (Array.isArray(patterns) && patterns.length > 0) {
                this.onImport(patterns);
                new Notice(`Imported ${patterns.length} patterns`);
                this.close();
              } else {
                new Notice("Invalid pattern format");
              }
            } catch (error) {
              new Notice("Failed to parse JSON");
            }
          })
      );

    contentEl.createEl("hr");

    // Quick Links
    const linksDiv = contentEl.createDiv("pii-quick-links");
    linksDiv.createEl("h3", { text: "Quick Links" });

    const linksList = linksDiv.createEl("ul");

    const links = [
      {
        text: "Example patterns.json",
        desc: "Community-maintained pattern library",
        url: "https://raw.githubusercontent.com/your-repo/patterns.json"
      },
      {
        text: "PII Pattern Database",
        desc: "Common PII patterns",
        url: "https://example.com/pii-patterns.json"
      }
    ];

    links.forEach(link => {
      const li = linksList.createEl("li");
      const a = li.createEl("a", {
        text: link.text,
        attr: { href: "#" }
      });
      a.onclick = async (e) => {
        e.preventDefault();
        const patterns = await importFromURL(link.url);
        if (patterns.length > 0) {
          this.onImport(patterns);
          this.close();
        }
      };
      li.createEl("span", { text: ` - ${link.desc}`, cls: "pii-text-muted" });
    });

    // Close button
    const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
    buttonContainer
      .createEl("button", { text: "Cancel", cls: "pii-btn-secondary" })
      .onclick = () => this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
