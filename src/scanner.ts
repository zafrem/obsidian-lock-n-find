import type PiiLockPlugin from "../main";
import { TFile } from "obsidian";

export interface MatchInfo {
  file: TFile;      // file object
  line: number;     // 0‑based row number
  col: number;      // 0‑based column number
  text: string;     // matched string
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
  return results;    // UI(ResultsModal)
}