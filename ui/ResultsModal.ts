// ui/ResultsModal.ts
import { App, Modal, MarkdownView } from "obsidian";
import type { MatchInfo } from "../src/scanner";

export class ResultsModal extends Modal {
  constructor(
    app: App,
    private matches: MatchInfo[]
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");
    contentEl.createEl("h3", { text: `PII matches (${this.matches.length})` });

    if (!this.matches.length) {
      contentEl.createEl("p", { text: "No PII found" });
      return;
    }

    /* List DOM */
    const list = contentEl.createEl("div", { cls: "pii-list" });

    this.matches.forEach((m, idx) => {
      const item = list.createEl("div", { cls: "pii-item" });

      /* ✔︎ Checkbox */
      const cb = item.createEl("input", { type: "checkbox" });
      cb.checked = true; // Default selection

      /* Matching string + location */
      item.createEl("span", {
        text: `${m.text}  —  ${m.file.basename}:${m.line + 1}`,
        cls: "pii-text",
      });

      /* ▶︎ Open file button */
      const goBtn = item.createEl("button", { text: "Open" });
      goBtn.onclick = () => this.openAtPosition(m);
    });

    /* Close button */
    contentEl.createEl("button", {
      text: "Close",
      cls: "mod-cta",
    }).onclick = () => this.close();
  }

  /** Open the same file and move cursor */
  private async openAtPosition(m: MatchInfo) {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(m.file);
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) view.editor.setCursor({ line: m.line, ch: m.col });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
