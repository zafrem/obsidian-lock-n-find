import type PiiLockPlugin from "../main";
import { TFile } from "obsidian";

export interface MatchInfo {
  file: TFile;      // 파일 객체
  line: number;     // 0‑based 행 번호
  col: number;      // 0‑based 열 번호
  text: string;     // 매칭된 문자열
}

export async function scanVault(plugin: PiiLockPlugin): Promise<MatchInfo[]> {
  const vault = plugin.app.vault;
  const patterns = plugin.settings.patterns.map(p => new RegExp(p, "g"));
  const results: MatchInfo[] = [];

  for (const file of vault.getMarkdownFiles()) {
    const content = await vault.cachedRead(file);
    const lines = content.split("\n");

    lines.forEach((lineText, lineNum) => {
      patterns.forEach(re => {
        for (const m of lineText.matchAll(re)) {
          results.push({
            file,
            line: lineNum,
            col: m.index ?? 0,
            text: m[0],
          });
        }
      });
    });
  }
  return results;    // UI(ResultsModal 등)에서 자유롭게 사용
}