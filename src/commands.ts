import type PiiLockPlugin from "../main";
import { scanVault } from "./scanner";
import { encrypt, decrypt } from "./crypto";
import { ResultsModal } from "../ui/ResultsModal";

export function registerCommands(plugin: PiiLockPlugin) {
  /* 1. Scan */
  plugin.addCommand({
    id: "pii-scan",
    name: "PII Scan",
    callback: async () => {
      const results = await scanVault(plugin);
      new ResultsModal(plugin.app, results).open();
    },
  });

  /* 2. Lock (Matching tokenization + encrypted storage) */
  plugin.addCommand({
    id: "pii-lock",
    name: "PII Lock (encrypt)",
    callback: () => {
      // TODO: Actual implementation - matches → token replacement, encrypt(), saveData()
    },
  });

  /* 3. Unlock */
  plugin.addCommand({
    id: "pii-unlock",
    name: "PII Unlock (decrypt)",
    callback: () => {
      // TODO: Enter password → decrypt() → revert token
    },
  });
}
