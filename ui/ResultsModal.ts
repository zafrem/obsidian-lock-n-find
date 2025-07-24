// ui/ResultsModal.ts
import { App, Modal, MarkdownView, TFile } from "obsidian";
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
    contentEl.createEl("h3", { text: `PII Matches (${this.matches.length})` });

    if (!this.matches.length) {
      contentEl.createEl("p", { text: "No PII found 🎉" });
      return;
    }

    /* 리스트 DOM */
    const list = contentEl.createEl("div", { cls: "pii-list" });

    this.matches.forEach((m, idx) => {
      const item = list.createEl("div", { cls: "pii-item" });

      /* ✔︎ 체크박스 */
      const cb = item.createEl("input", { type: "checkbox" }) as HTMLInputElement;
      cb.checked = true; // 기본 선택

      /* 매칭 문자열 + 위치 */
      item.createEl("span", {
        text: `${m.text}  —  ${m.file.basename}:${m.line + 1}`,
        cls: "pii-text",
      });

      /* ▶︎ 파일 열기 버튼 */
      const goBtn = item.createEl("button", { text: "Open" });
      goBtn.onclick = () => this.openAtPosition(m);
    });

    /* 닫기 버튼 */
    contentEl.createEl("button", {
      text: "Close",
      cls: "mod-cta",
    }).onclick = () => this.close();
  }

  /** 같은 파일을 열어 커서 이동 */
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
