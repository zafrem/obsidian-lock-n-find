import type PiiLockPlugin from "../main";
import { scanVault } from "./scanner";
import { ResultsModal } from "../ui/ResultsModal";

export function registerCommands(plugin: PiiLockPlugin) {
  /* 1. Scan */
  plugin.addCommand({
    id: "scan",
    name: "Pii scan",
    callback: async () => {
      const results = await scanVault(plugin);
      new ResultsModal(plugin.app, results).open();
    },
  });

  /* 2. Lock (Matching tokenization + encrypted storage) */
  plugin.addCommand({
    id: "lock",
    name: "Pii lock (encrypt)",
    callback: () => {
      // TODO: Actual implementation - matches → token replacement, encrypt(), saveData()
    },
  });

  /* 3. Unlock */
  plugin.addCommand({
    id: "unlock",
    name: "Pii unlock (decrypt)",
    callback: () => {
      // TODO: Enter password → decrypt() → revert token
    },
  });
}
