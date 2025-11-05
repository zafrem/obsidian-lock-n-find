var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/api/types.ts
var DEFAULT_API_SETTINGS, ApiError;
var init_types = __esm({
  "src/api/types.ts"() {
    DEFAULT_API_SETTINGS = {
      enabled: false,
      port: 27750,
      apiKey: "",
      tlsCertPath: "",
      tlsKeyPath: "",
      allowedOrigins: ["https://localhost"],
      rateLimit: {
        windowMs: 6e4,
        // 1 minute
        maxRequests: 100
      },
      logRequests: true
    };
    ApiError = class extends Error {
      constructor(code, message, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "ApiError";
      }
    };
  }
});

// src/scanner.ts
async function scanVault(plugin) {
  const vault = plugin.app.vault;
  const patterns = plugin.settings.patterns.map((p) => new RegExp(p, "g"));
  const results = [];
  for (const file of vault.getMarkdownFiles()) {
    const content = await vault.cachedRead(file);
    const lines = content.split("\n");
    lines.forEach((lineText, lineNum) => {
      patterns.forEach((re) => {
        for (const m of lineText.matchAll(re)) {
          results.push({
            file,
            line: lineNum,
            col: m.index ?? 0,
            text: m[0]
          });
        }
      });
    });
  }
  return results;
}
var init_scanner = __esm({
  "src/scanner.ts"() {
  }
});

// src/crypto.ts
async function deriveKey(pwd) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pwd),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("pii-salt"),
      iterations: 5e4,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encrypt(text, pwd) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pwd);
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  return `${Buffer.from(iv).toString("base64")}.${Buffer.from(buf).toString("base64")}`;
}
async function decrypt(data, pwd) {
  const [ivB64, bufB64] = data.split(".");
  const iv = Uint8Array.from(Buffer.from(ivB64, "base64"));
  const buf = Buffer.from(bufB64, "base64");
  const key = await deriveKey(pwd);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, buf);
  return new TextDecoder().decode(dec);
}
var init_crypto = __esm({
  "src/crypto.ts"() {
  }
});

// ui/LnFSidebarView.ts
var LnFSidebarView_exports = {};
__export(LnFSidebarView_exports, {
  LnFSidebarView: () => LnFSidebarView,
  PwModal: () => PwModal,
  VIEW_TYPE_PII: () => VIEW_TYPE_PII
});
var import_obsidian, VIEW_TYPE_PII, DRAGGABLE_SELECTION_TIMEOUT, STATUS_MESSAGE_TIMEOUT, makeUUID, createScanIcon, createSpinnerIcon, createClearIcon, createLockIcon, createUnlockIcon, createEmptyStateIcon, createButtonContent, PwModal, LnFSidebarView;
var init_LnFSidebarView = __esm({
  "ui/LnFSidebarView.ts"() {
    import_obsidian = require("obsidian");
    init_scanner();
    init_crypto();
    VIEW_TYPE_PII = "pii-sidebar-view";
    DRAGGABLE_SELECTION_TIMEOUT = 5e3;
    STATUS_MESSAGE_TIMEOUT = 3e3;
    makeUUID = () => {
      if ("randomUUID" in crypto && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    };
    createScanIcon = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M5,3H19C20.11,3 21,3.89 21,5V13.03C20.5,12.23 19.81,11.54 19,11V5H5V19H9.5C9.81,19.75 10.26,20.42 10.81,21H5C3.89,21 3,20.11 3,19V5C3,3.89 3.89,3 5,3M7,7H17V9H7V7M7,11H12.03C11.23,11.5 10.54,12.19 10,13H7V11M7,15H9.17C9.06,15.5 9,16 9,16.5V17H7V15Z");
      svg.appendChild(path);
      return svg;
    };
    createSpinnerIcon = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z");
      const animateTransform = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      animateTransform.setAttribute("attributeName", "transform");
      animateTransform.setAttribute("attributeType", "XML");
      animateTransform.setAttribute("type", "rotate");
      animateTransform.setAttribute("dur", "1s");
      animateTransform.setAttribute("from", "0 12 12");
      animateTransform.setAttribute("to", "360 12 12");
      animateTransform.setAttribute("repeatCount", "indefinite");
      path.appendChild(animateTransform);
      svg.appendChild(path);
      return svg;
    };
    createClearIcon = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z");
      svg.appendChild(path);
      return svg;
    };
    createLockIcon = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z");
      svg.appendChild(path);
      return svg;
    };
    createUnlockIcon = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z");
      svg.appendChild(path);
      return svg;
    };
    createEmptyStateIcon = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "32");
      svg.setAttribute("height", "32");
      svg.addClass("pii-empty-icon");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 12,10.5M7.5,10.5A1.5,1.5 0 0,0 6,12A1.5,1.5 0 0,0 7.5,13.5A1.5,1.5 0 0,0 9,12A1.5,1.5 0 0,0 7.5,10.5M16.5,10.5A1.5,1.5 0 0,0 15,12A1.5,1.5 0 0,0 16.5,13.5A1.5,1.5 0 0,0 18,12A1.5,1.5 0 0,0 16.5,10.5Z");
      svg.appendChild(path);
      return svg;
    };
    createButtonContent = (icon, text) => {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(icon);
      fragment.appendChild(document.createTextNode(` ${text}`));
      return fragment;
    };
    PwModal = class extends import_obsidian.Modal {
      constructor(app, title, isEncrypt = false) {
        super(app);
        this.title = title;
        this.isEncrypt = isEncrypt;
      }
      onOpen() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass("pii-modal");
        const contentContainer = containerEl.createDiv({
          cls: "pii-modal-content"
        });
        const titleEl = contentContainer.createEl("h3", {
          cls: "pii-modal-title"
        });
        const icon = this.isEncrypt ? "\u{1F512}" : "\u{1F513}";
        titleEl.textContent = `${icon} ${this.title}`;
        const description = this.isEncrypt ? "Enter a password to encrypt your sensitive information. Remember this password as you'll need it to decrypt later." : "Enter your password to decrypt the protected information.";
        contentContainer.createEl("p", {
          text: description,
          cls: "pii-modal-description"
        });
        let pw = "";
        let showPassword = false;
        const formContainer = contentContainer.createDiv({
          cls: "pii-modal-form"
        });
        const pwContainer = formContainer.createDiv({
          cls: "pii-password-container"
        });
        pwContainer.createEl("label", {
          text: "Password",
          cls: "pii-input-label"
        });
        const pwInputWrapper = pwContainer.createDiv({
          cls: "pii-input-wrapper"
        });
        const pwInput = pwInputWrapper.createEl("input", {
          type: "password",
          placeholder: this.isEncrypt ? "Create a strong password" : "Enter your password",
          cls: "pii-password-input"
        });
        pwInput.addEventListener("input", (e) => {
          pw = e.target.value;
        });
        pwInput.focus();
        pwInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            if (this.isEncrypt) {
              this.validateAndSubmit(pw, confirmPw);
            } else {
              this.submit(pw);
            }
          }
        });
        const toggleBtn = pwInputWrapper.createEl("button", {
          cls: "pii-password-toggle",
          text: "\u{1F441}\uFE0F"
          // Eye icon
        });
        toggleBtn.addEventListener("click", (e) => {
          e.preventDefault();
          showPassword = !showPassword;
          pwInput.type = showPassword ? "text" : "password";
          toggleBtn.textContent = showPassword ? "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F" : "\u{1F441}\uFE0F";
        });
        let confirmPw = "";
        let confirmInput = null;
        if (this.isEncrypt) {
          const confirmContainer = formContainer.createDiv({
            cls: "pii-password-container"
          });
          confirmContainer.createEl("label", {
            text: "Confirm password",
            cls: "pii-input-label"
          });
          const confirmInputWrapper = confirmContainer.createDiv({
            cls: "pii-input-wrapper"
          });
          confirmInput = confirmInputWrapper.createEl("input", {
            type: "password",
            placeholder: "Confirm your password",
            cls: "pii-password-input"
          });
          confirmInput.addEventListener("input", (e) => {
            confirmPw = e.target.value;
          });
          confirmInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              this.validateAndSubmit(pw, confirmPw);
            }
          });
          const confirmToggleBtn = confirmInputWrapper.createEl("button", {
            cls: "pii-password-toggle",
            text: "\u{1F441}\uFE0F"
            // Eye icon
          });
          confirmToggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            showPassword = !showPassword;
            if (confirmInput) {
              confirmInput.type = showPassword ? "text" : "password";
            }
            confirmToggleBtn.textContent = showPassword ? "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F" : "\u{1F441}\uFE0F";
            pwInput.type = showPassword ? "text" : "password";
            toggleBtn.textContent = showPassword ? "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F" : "\u{1F441}\uFE0F";
          });
        }
        const buttonContainer = contentContainer.createDiv({
          cls: "pii-modal-buttons"
        });
        const cancelBtn = buttonContainer.createEl("button", {
          text: "Cancel",
          cls: "pii-btn-secondary"
        });
        cancelBtn.onclick = () => this.close();
        const actionText = this.isEncrypt ? "Encrypt" : "Decrypt";
        const submitBtn = buttonContainer.createEl("button", {
          text: actionText,
          cls: "pii-btn-primary"
        });
        submitBtn.onclick = () => {
          if (this.isEncrypt) {
            this.validateAndSubmit(pw, confirmPw);
          } else {
            this.submit(pw);
          }
        };
      }
      validateAndSubmit(pw, confirmPw) {
        if (!pw) {
          new import_obsidian.Notice("Please enter a password");
          return;
        }
        if (this.isEncrypt && pw !== confirmPw) {
          new import_obsidian.Notice("Passwords do not match");
          return;
        }
        this.submit(pw);
      }
      submit(pw) {
        this.close();
        this._resolve(pw || null);
      }
      onClose() {
        this.contentEl.empty();
      }
      wait() {
        this.open();
        return new Promise((res) => this._resolve = res);
      }
    };
    LnFSidebarView = class extends import_obsidian.ItemView {
      constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.matches = [];
        this.searchResults = [];
        this.manualSelections = [];
        this.selected = /* @__PURE__ */ new Set();
        this.cachedPassword = null;
        this.currentMode = "scan";
        // Bound event handlers to prevent memory leaks
        this.boundHandleTextSelection = this.handleTextSelection.bind(this);
        this.boundHandleDragStart = this.handleDragStart.bind(this);
      }
      getViewType() {
        return VIEW_TYPE_PII;
      }
      getDisplayText() {
        return "Lock and find";
      }
      getIcon() {
        return "shield";
      }
      async onOpen() {
        const e = this.containerEl;
        e.empty();
        this.setupTextSelectionDragDrop();
        const modeContainer = e.createEl("div", { cls: "pii-mode-toggle" });
        const scanModeBtn = modeContainer.createEl("button", {
          cls: this.currentMode === "scan" ? "pii-btn-primary pii-btn-half" : "pii-btn-secondary pii-btn-half",
          text: "Scan mode"
        });
        const searchModeBtn = modeContainer.createEl("button", {
          cls: this.currentMode === "search" ? "pii-btn-primary pii-btn-half" : "pii-btn-secondary pii-btn-half",
          text: "Search mode"
        });
        scanModeBtn.onclick = () => {
          this.currentMode = "scan";
          scanModeBtn.className = "pii-btn-primary pii-btn-half";
          searchModeBtn.className = "pii-btn-secondary pii-btn-half";
          this.render();
        };
        searchModeBtn.onclick = () => {
          this.currentMode = "search";
          scanModeBtn.className = "pii-btn-secondary pii-btn-half";
          searchModeBtn.className = "pii-btn-primary pii-btn-half";
          this.render();
        };
        const scanControls = e.createEl("div", { cls: "pii-scan-controls" });
        const scan = scanControls.createEl("button", { cls: "pii-btn-primary pii-btn-half" });
        scan.appendChild(createButtonContent(createScanIcon(), "Scan Vault"));
        const clear = scanControls.createEl("button", { cls: "pii-btn-secondary pii-btn-half" });
        clear.appendChild(createButtonContent(createClearIcon(), "Clear"));
        scan.onclick = async () => {
          scan.disabled = true;
          scan.empty();
          scan.appendChild(createButtonContent(createSpinnerIcon(), "Scanning..."));
          this.matches = await scanVault(this.plugin);
          this.selected.clear();
          this.render();
          scan.disabled = false;
          scan.empty();
          scan.appendChild(createButtonContent(createScanIcon(), "Scan Vault"));
        };
        clear.onclick = () => {
          this.matches = [];
          this.searchResults = [];
          this.manualSelections = [];
          this.selected.clear();
          this.render();
        };
        const searchContainer = e.createEl("div", { cls: "pii-search-container" });
        const searchInput = searchContainer.createEl("input", {
          type: "text",
          placeholder: "Search for text to encrypt...",
          cls: "pii-search-input"
        });
        const searchBtn = searchContainer.createEl("button", { cls: "pii-btn-primary" });
        searchBtn.appendChild(createButtonContent(createScanIcon(), "Search"));
        searchBtn.onclick = async () => {
          const query = searchInput.value.trim();
          if (!query) {
            new import_obsidian.Notice("Please enter search text");
            return;
          }
          searchBtn.disabled = true;
          searchBtn.empty();
          searchBtn.appendChild(createButtonContent(createSpinnerIcon(), "Searching..."));
          this.searchResults = await this.searchVault(query);
          this.selected.clear();
          this.render();
          searchBtn.disabled = false;
          searchBtn.empty();
          searchBtn.appendChild(createButtonContent(createScanIcon(), "Search"));
        };
        searchInput.addEventListener("keydown", (e2) => {
          if (e2.key === "Enter") {
            searchBtn.click();
          }
        });
        e.createEl("hr");
        e.createEl("div", { cls: "pii-list" });
        const dropArea = e.createEl("div", { cls: "pii-drop" });
        dropArea.createEl("div", { cls: "pii-drop-icon", text: "" });
        dropArea.createEl("div", { text: "Drag items here to encrypt" });
        const bot = e.createEl("div", { cls: "pii-btn-bar-bottom" });
        const lockBtn = bot.createEl("button", { cls: "pii-btn-primary pii-btn-half" });
        lockBtn.appendChild(createButtonContent(createLockIcon(), "Lock Selected"));
        lockBtn.onclick = () => this.lock();
        const unlockBtn = bot.createEl("button", { cls: "pii-btn-secondary pii-btn-half" });
        unlockBtn.appendChild(createButtonContent(createUnlockIcon(), "Unlock All"));
        unlockBtn.onclick = () => this.unlock();
      }
      async onClose() {
        this.containerEl.empty();
        this.cleanupTextSelectionDragDrop();
      }
      /* -------- Text Selection Drag & Drop Setup -------- */
      setupTextSelectionDragDrop() {
        document.addEventListener("mouseup", this.boundHandleTextSelection);
        document.addEventListener("dragstart", this.boundHandleDragStart);
      }
      cleanupTextSelectionDragDrop() {
        document.removeEventListener("mouseup", this.boundHandleTextSelection);
        document.removeEventListener("dragstart", this.boundHandleDragStart);
      }
      handleTextSelection(event) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
          return;
        const selectedText = selection.toString().trim();
        if (!selectedText)
          return;
        const target = event.target;
        const editorContainer = target.closest(".markdown-source-view, .cm-editor");
        if (!editorContainer)
          return;
        const range = selection.getRangeAt(0);
        if (range.collapsed)
          return;
        try {
          const span = document.createElement("span");
          span.draggable = true;
          span.addClass("pii-draggable-text");
          span.title = "Drag to encrypt this text";
          span.setAttribute("data-selected-text", selectedText);
          range.surroundContents(span);
          setTimeout(() => {
            if (span && span.parentNode) {
              const parent = span.parentNode;
              while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
              }
              parent.removeChild(span);
            }
          }, DRAGGABLE_SELECTION_TIMEOUT);
        } catch (e) {
          console.error("Could not make selection draggable:", e);
        }
      }
      handleDragStart(event) {
        const target = event.target;
        const selectedText = target.getAttribute("data-selected-text");
        if (selectedText && event.dataTransfer) {
          event.dataTransfer.setData("text/plain", selectedText);
          event.dataTransfer.setData("application/x-selected-text", selectedText);
          event.dataTransfer.effectAllowed = "copy";
        }
      }
      /* -------- Search Vault -------- */
      async searchVault(query) {
        const results = [];
        const files = this.app.vault.getMarkdownFiles();
        for (const file of files) {
          const content = await this.app.vault.cachedRead(file);
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let index = 0;
            while ((index = line.toLowerCase().indexOf(query.toLowerCase(), index)) !== -1) {
              const match = {
                text: line.substring(index, index + query.length),
                file,
                line: i,
                col: index
              };
              results.push(match);
              index += query.length;
            }
          }
        }
        return results;
      }
      /* -------- Render UI -------- */
      render() {
        const list = this.containerEl.querySelector(".pii-list");
        const drop = this.containerEl.querySelector(".pii-drop");
        const searchContainer = this.containerEl.querySelector(".pii-search-container");
        const scanControls = this.containerEl.querySelector(".pii-scan-controls");
        if (searchContainer) {
          searchContainer.toggleClass("pii-hidden", this.currentMode !== "search");
        }
        if (scanControls) {
          scanControls.toggleClass("pii-hidden", this.currentMode !== "scan");
        }
        list.empty();
        drop.empty();
        drop.createEl("div", { cls: "pii-drop-icon", text: "\u{1F512}" });
        drop.createEl("div", { text: "Drag items here to encrypt" });
        const currentResults = this.currentMode === "scan" ? this.matches : this.searchResults;
        const emptyMessage = this.currentMode === "scan" ? "No sensitive information found" : "No search results found";
        if (!currentResults.length) {
          const emptyContainer = list.createEl("div", { cls: "pii-empty" });
          emptyContainer.appendChild(createEmptyStateIcon());
          list.createEl("p", { text: emptyMessage });
          return;
        }
        currentResults.forEach((m, i) => {
          const row = list.createEl("div", { cls: "pii-row" });
          row.createEl("div", { cls: "pii-row-text", text: m.text });
          row.createEl("div", { cls: "pii-row-location", text: `${m.file.basename}:${m.line + 1}` });
          row.setAttr("draggable", "true");
          row.ondragstart = (e) => e.dataTransfer?.setData("text/plain", String(i));
          row.onclick = async () => {
            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(m.file);
            this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView)?.editor.setCursor({ line: m.line, ch: m.col });
          };
        });
        drop.ondragover = (e) => {
          e.preventDefault();
          drop.addClass("hover");
        };
        drop.ondragleave = () => drop.removeClass("hover");
        drop.ondrop = (e) => {
          e.preventDefault();
          drop.removeClass("hover");
          const selectedText = e.dataTransfer?.getData("application/x-selected-text");
          if (selectedText) {
            this.addManualSelection(selectedText, drop);
            return;
          }
          const i = parseInt(e.dataTransfer?.getData("text/plain") || "-1");
          if (i >= 0 && !this.selected.has(i)) {
            this.selected.add(i);
            const tag = drop.createEl("div", { cls: "pii-tag" });
            tag.textContent = currentResults[i].text;
            const removeBtn = tag.createEl("span", { cls: "pii-tag-remove pii-tag-remove-button", text: "\xD7" });
            removeBtn.onclick = (evt) => {
              evt.stopPropagation();
              this.selected.delete(i);
              tag.remove();
            };
          }
        };
      }
      /* -------- Add Manual Selection -------- */
      addManualSelection(text, dropArea) {
        const id = makeUUID();
        this.manualSelections.push({ text, id });
        const tag = dropArea.createEl("div", { cls: "pii-tag pii-tag-manual" });
        tag.textContent = text;
        tag.setAttribute("data-manual-id", id);
        const removeBtn = tag.createEl("span", { cls: "pii-tag-remove pii-tag-remove-button", text: "\xD7" });
        removeBtn.onclick = (evt) => {
          evt.stopPropagation();
          this.manualSelections = this.manualSelections.filter((s) => s.id !== id);
          tag.remove();
        };
        new import_obsidian.Notice(`Added "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}" for encryption`);
      }
      /* -------- Encrypt Manual Selection -------- */
      async encryptManualSelection(text, password) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          throw new Error("No active file to encrypt text in");
        }
        let fileContent = await this.app.vault.cachedRead(activeFile);
        const index = fileContent.indexOf(text);
        if (index === -1) {
          console.warn(`Text not found in active file: ${text.substring(0, 50)}`);
          new import_obsidian.Notice(`Text not found in active file: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`);
          return;
        }
        const cipher = await encrypt(text, password);
        const wrapped = `<details>
 <summary>Lock</summary>
 \xA7ENC_${makeUUID().slice(0, 6)}_${cipher}\xA7
</details>`;
        fileContent = fileContent.substring(0, index) + wrapped + fileContent.substring(index + text.length);
        await this.app.vault.modify(activeFile, fileContent);
      }
      /* -------- Get Password (with caching) -------- */
      async getPassword(isEncrypt = false) {
        if (this.cachedPassword) {
          return this.cachedPassword;
        }
        if (!isEncrypt && this.plugin.settings.storedPassword) {
          const pwd2 = await new PwModal(this.app, "Enter Your Password", false).wait();
          if (pwd2) {
            const encoder = new TextEncoder();
            const data = encoder.encode(pwd2);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
            if (hashHex === this.plugin.settings.storedPassword) {
              this.cachedPassword = pwd2;
              return pwd2;
            } else {
              new import_obsidian.Notice("Incorrect password");
              return null;
            }
          }
          return null;
        }
        const title = isEncrypt ? "Encrypt Sensitive Information" : "Decrypt Protected Information";
        const pwd = await new PwModal(this.app, title, isEncrypt).wait();
        if (pwd) {
          this.cachedPassword = pwd;
          if (isEncrypt && !this.plugin.settings.storedPassword) {
            const encoder = new TextEncoder();
            const data = encoder.encode(pwd);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
            this.plugin.settings.storedPassword = hashHex;
            await this.plugin.saveSettings();
            new import_obsidian.Notice("Password saved for future use");
          }
        }
        return pwd;
      }
      /* -------- Clear cached password -------- */
      clearCachedPassword() {
        this.cachedPassword = null;
      }
      /* -------- Encrypt (Lock) -------- */
      async lock() {
        const currentResults = this.currentMode === "scan" ? this.matches : this.searchResults;
        if (!this.selected.size) {
          currentResults.forEach((_, i) => this.selected.add(i));
        }
        if (!this.selected.size && !this.manualSelections.length) {
          new import_obsidian.Notice("No items selected for encryption");
          return;
        }
        const pwd = await this.getPassword(true);
        if (!pwd)
          return;
        const totalItems = this.selected.size + this.manualSelections.length;
        const statusBar = this.containerEl.createEl("div", {
          cls: "pii-status",
          text: `Encrypting ${totalItems} item(s)...`
        });
        try {
          let processedCount = 0;
          for (const i of this.selected) {
            const m = currentResults[i];
            const file = m.file;
            let text = await this.app.vault.cachedRead(file);
            const cipher = await encrypt(m.text, pwd);
            const wrapped = `<details>
 <summary>Lock</summary>
 \xA7ENC_${makeUUID().slice(0, 6)}_${cipher}\xA7
</details>`;
            text = text.replace(m.text, wrapped);
            await this.app.vault.modify(file, text);
            processedCount++;
          }
          for (const selection of this.manualSelections) {
            await this.encryptManualSelection(selection.text, pwd);
            processedCount++;
          }
          new import_obsidian.Notice(`Successfully encrypted ${processedCount} item(s)`);
          if (this.currentMode === "scan") {
            this.matches = [];
          } else {
            this.searchResults = [];
          }
          this.selected.clear();
          this.manualSelections = [];
          this.render();
        } catch (error) {
          console.error("Encryption error:", error);
          new import_obsidian.Notice("Error during encryption. Please try again.");
        } finally {
          if (statusBar && statusBar.parentNode) {
            statusBar.remove();
          }
        }
      }
      /* -------- Decrypt (Unlock) -------- */
      async unlock() {
        const pwd = await this.getPassword(false);
        if (!pwd)
          return;
        const encRegex = /<details>\s*<summary>Lock<\/summary>\s*§ENC_[A-Za-z0-9]{6}_(.*?)§\s*<\/details>/g;
        const statusBar = this.containerEl.createEl("div", {
          cls: "pii-status",
          text: "Searching for encrypted content..."
        });
        try {
          let unlocked = 0;
          let filesProcessed = 0;
          const totalFiles = this.app.vault.getMarkdownFiles().length;
          for (const f of this.app.vault.getMarkdownFiles()) {
            filesProcessed++;
            statusBar.textContent = `Processing files... (${filesProcessed}/${totalFiles})`;
            let txt = await this.app.vault.cachedRead(f);
            const matches = [];
            let match;
            while ((match = encRegex.exec(txt)) !== null) {
              matches.push({
                full: match[0],
                cipher: match[1]
              });
            }
            if (matches.length === 0)
              continue;
            statusBar.textContent = `Decrypting content in ${f.basename}...`;
            let changed = false;
            for (const m of matches) {
              try {
                const plain = await decrypt(m.cipher, pwd);
                txt = txt.replace(m.full, plain);
                unlocked++;
                changed = true;
              } catch (e) {
                console.error("Decryption failed:", e);
                if (this.cachedPassword) {
                  this.clearCachedPassword();
                  new import_obsidian.Notice("Decryption failed. Password cache cleared.");
                }
              }
            }
            if (changed)
              await this.app.vault.modify(f, txt);
          }
          if (unlocked > 0) {
            statusBar.textContent = `Successfully decrypted ${unlocked} item(s)`;
            statusBar.addClass("pii-status-success");
            new import_obsidian.Notice(`Successfully decrypted ${unlocked} item(s)`);
          } else {
            statusBar.textContent = "No encrypted content found or incorrect password";
            new import_obsidian.Notice("No encrypted content found or incorrect password");
            this.clearCachedPassword();
          }
          setTimeout(() => {
            if (statusBar && statusBar.parentNode) {
              statusBar.remove();
            }
          }, STATUS_MESSAGE_TIMEOUT);
        } catch (error) {
          console.error("Decryption error:", error);
          new import_obsidian.Notice("Error during decryption. Please try again.");
          if (statusBar && statusBar.parentNode) {
            statusBar.remove();
          }
        }
      }
    };
  }
});

// src/ui/ApiKeyModal.ts
var ApiKeyModal_exports = {};
__export(ApiKeyModal_exports, {
  ApiKeyModal: () => ApiKeyModal
});
var import_obsidian2, ApiKeyModal, KeyNameModal, KeyDisplayModal, ConfirmModal;
var init_ApiKeyModal = __esm({
  "src/ui/ApiKeyModal.ts"() {
    import_obsidian2 = require("obsidian");
    ApiKeyModal = class extends import_obsidian2.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pii-modal");
        contentEl.createEl("h2", { text: "API key management" });
        contentEl.createEl("p", {
          text: "Generate and manage API keys for external access to Lock & Find",
          cls: "pii-modal-description"
        });
        new import_obsidian2.Setting(contentEl).setName("Generate new API key").setDesc("Create a new API key for authentication").addButton(
          (btn) => btn.setButtonText("Generate key").setCta().onClick(async () => {
            await this.generateNewKey();
          })
        );
        contentEl.createEl("hr");
        contentEl.createEl("h3", { text: "Existing API keys" });
        this.keysList = contentEl.createDiv("pii-keys-list");
        this.renderKeys();
        const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
        buttonContainer.createEl("button", { text: "Close", cls: "pii-btn-primary" }).onclick = () => this.close();
      }
      renderKeys() {
        this.keysList.empty();
        const apiServer = this.plugin.getApiServer();
        if (!apiServer) {
          this.keysList.createEl("p", {
            text: "API server not initialized",
            cls: "pii-text-muted"
          });
          return;
        }
        const keys = apiServer.getKeyManager().listKeys();
        if (keys.length === 0) {
          this.keysList.createEl("p", {
            text: "No API keys created yet",
            cls: "pii-text-muted"
          });
          return;
        }
        keys.forEach((key) => {
          const keyItem = this.keysList.createDiv("pii-key-item");
          const keyInfo = keyItem.createDiv("pii-key-info");
          keyInfo.createEl("strong", { text: key.name });
          keyInfo.createEl("div", {
            text: `Created: ${new Date(key.createdAt).toLocaleString()}`,
            cls: "pii-text-small"
          });
          if (key.lastUsed) {
            keyInfo.createEl("div", {
              text: `Last used: ${new Date(key.lastUsed).toLocaleString()}`,
              cls: "pii-text-small"
            });
          }
          keyInfo.createEl("div", {
            text: `Usage count: ${key.usageCount}`,
            cls: "pii-text-small"
          });
          keyItem.createEl("span", {
            cls: key.enabled ? "pii-status-active" : "pii-status-inactive",
            text: key.enabled ? "Active" : "Revoked"
          });
          const actions = keyItem.createDiv("pii-key-actions");
          if (key.enabled) {
            const revokeBtn = actions.createEl("button", {
              text: "Revoke",
              cls: "pii-btn-warning"
            });
            revokeBtn.onclick = async () => {
              await this.revokeKey(key);
            };
          }
          const deleteBtn = actions.createEl("button", {
            text: "Delete",
            cls: "pii-btn-danger"
          });
          deleteBtn.onclick = async () => {
            await this.deleteKey(key);
          };
        });
      }
      async generateNewKey() {
        const apiServer = this.plugin.getApiServer();
        if (!apiServer) {
          new import_obsidian2.Notice("API server not initialized");
          return;
        }
        const name = await this.promptForKeyName();
        if (!name)
          return;
        try {
          const rawKey = await apiServer.getKeyManager().generateKey(name);
          this.plugin.settings.apiKeys = apiServer.getKeyManager().serializeKeys();
          await this.plugin.saveSettings();
          this.showKeyModal(rawKey, name);
          this.renderKeys();
          new import_obsidian2.Notice(`API key "${name}" generated successfully`);
        } catch (error) {
          console.error("Failed to generate API key:", error);
          new import_obsidian2.Notice("Failed to generate API key");
        }
      }
      async revokeKey(key) {
        const apiServer = this.plugin.getApiServer();
        if (!apiServer)
          return;
        const confirmed = await this.confirmAction(
          `Are you sure you want to revoke the key "${key.name}"? It will no longer be usable.`
        );
        if (!confirmed)
          return;
        try {
          await apiServer.getKeyManager().revokeKey(key.id);
          this.plugin.settings.apiKeys = apiServer.getKeyManager().serializeKeys();
          await this.plugin.saveSettings();
          this.renderKeys();
          new import_obsidian2.Notice(`API key "${key.name}" revoked`);
        } catch (error) {
          console.error("Failed to revoke API key:", error);
          new import_obsidian2.Notice("Failed to revoke API key");
        }
      }
      async deleteKey(key) {
        const apiServer = this.plugin.getApiServer();
        if (!apiServer)
          return;
        const confirmed = await this.confirmAction(
          `Are you sure you want to permanently delete the key "${key.name}"? This action cannot be undone.`
        );
        if (!confirmed)
          return;
        try {
          await apiServer.getKeyManager().deleteKey(key.id);
          this.plugin.settings.apiKeys = apiServer.getKeyManager().serializeKeys();
          await this.plugin.saveSettings();
          this.renderKeys();
          new import_obsidian2.Notice(`API key "${key.name}" deleted`);
        } catch (error) {
          console.error("Failed to delete API key:", error);
          new import_obsidian2.Notice("Failed to delete API key");
        }
      }
      async promptForKeyName() {
        return new Promise((resolve) => {
          const modal = new KeyNameModal(this.app, (name) => resolve(name));
          modal.open();
        });
      }
      showKeyModal(key, name) {
        new KeyDisplayModal(this.app, key, name).open();
      }
      async confirmAction(message) {
        return new Promise((resolve) => {
          const modal = new ConfirmModal(
            this.app,
            message,
            (confirmed) => resolve(confirmed)
          );
          modal.open();
        });
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    KeyNameModal = class extends import_obsidian2.Modal {
      constructor(app, onSubmit) {
        super(app);
        this.onSubmit = onSubmit;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pii-modal");
        contentEl.createEl("h3", { text: "Enter key name" });
        contentEl.createEl("p", {
          text: "Give this API key a descriptive name",
          cls: "pii-modal-description"
        });
        this.nameInput = contentEl.createEl("input", {
          type: "text",
          placeholder: "e.g., Desktop App, Mobile Device",
          cls: "pii-input-full"
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
        buttonContainer.createEl("button", { text: "Cancel", cls: "pii-btn-secondary" }).onclick = () => {
          this.onSubmit(null);
          this.close();
        };
        buttonContainer.createEl("button", { text: "Create", cls: "pii-btn-primary" }).onclick = () => this.submit();
      }
      submit() {
        const name = this.nameInput.value.trim();
        if (!name) {
          new import_obsidian2.Notice("Please enter a key name");
          return;
        }
        this.onSubmit(name);
        this.close();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    KeyDisplayModal = class extends import_obsidian2.Modal {
      constructor(app, key, name) {
        super(app);
        this.key = key;
        this.name = name;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pii-modal");
        contentEl.createEl("h3", { text: "API key generated" });
        contentEl.createEl("p", {
          text: `Your API key "${this.name}" has been generated. Copy it now - you won't be able to see it again!`,
          cls: "pii-warning-text"
        });
        const keyContainer = contentEl.createDiv("pii-key-display");
        keyContainer.createEl("code", {
          text: this.key,
          cls: "pii-key-text"
        });
        const copyBtn = keyContainer.createEl("button", {
          text: "Copy",
          cls: "pii-btn-primary"
        });
        copyBtn.onclick = async () => {
          await navigator.clipboard.writeText(this.key);
          new import_obsidian2.Notice("API key copied to clipboard");
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 2e3);
        };
        const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
        buttonContainer.createEl("button", { text: "Close", cls: "pii-btn-primary" }).onclick = () => this.close();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    ConfirmModal = class extends import_obsidian2.Modal {
      constructor(app, message, onConfirm) {
        super(app);
        this.message = message;
        this.onConfirm = onConfirm;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pii-modal");
        contentEl.createEl("h3", { text: "Confirm action" });
        contentEl.createEl("p", { text: this.message });
        const buttonContainer = contentEl.createDiv({ cls: "pii-modal-buttons" });
        buttonContainer.createEl("button", { text: "Cancel", cls: "pii-btn-secondary" }).onclick = () => {
          this.onConfirm(false);
          this.close();
        };
        buttonContainer.createEl("button", { text: "Confirm", cls: "pii-btn-warning" }).onclick = () => {
          this.onConfirm(true);
          this.close();
        };
      }
      onClose() {
        this.contentEl.empty();
      }
    };
  }
});

// src/api/routes/search.ts
var search_exports = {};
__export(search_exports, {
  handleSearchRequest: () => handleSearchRequest
});
async function handleSearchRequest(app, body, type) {
  if (!body.query || typeof body.query !== "string") {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Query is required and must be a string",
      400
    );
  }
  const caseSensitive = body.caseSensitive ?? false;
  const maxResults = body.maxResults ?? 1e3;
  if (maxResults < 1 || maxResults > 1e4) {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "maxResults must be between 1 and 10000",
      400
    );
  }
  const results = [];
  const files = app.vault.getMarkdownFiles();
  if (type === "regex") {
    let regex;
    try {
      const flags = caseSensitive ? "g" : "gi";
      regex = new RegExp(body.query, flags);
    } catch (error) {
      throw new ApiError(
        "INVALID_REGEX" /* INVALID_REGEX */,
        `Invalid regular expression: ${error instanceof Error ? error.message : "Unknown error"}`,
        400
      );
    }
    for (const file of files) {
      if (results.length >= maxResults)
        break;
      const content = await app.vault.cachedRead(file);
      const lines = content.split("\n");
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        if (results.length >= maxResults)
          break;
        const lineText = lines[lineNum];
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(lineText)) !== null) {
          if (results.length >= maxResults)
            break;
          results.push({
            file: file.path,
            line: lineNum,
            col: match.index,
            text: match[0],
            context: lineText.trim()
          });
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      }
    }
  } else {
    const query = caseSensitive ? body.query : body.query.toLowerCase();
    for (const file of files) {
      if (results.length >= maxResults)
        break;
      const content = await app.vault.cachedRead(file);
      const lines = content.split("\n");
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        if (results.length >= maxResults)
          break;
        const lineText = lines[lineNum];
        const searchLine = caseSensitive ? lineText : lineText.toLowerCase();
        let index = 0;
        while ((index = searchLine.indexOf(query, index)) !== -1) {
          if (results.length >= maxResults)
            break;
          results.push({
            file: file.path,
            line: lineNum,
            col: index,
            text: lineText.substring(index, index + body.query.length),
            context: lineText.trim()
          });
          index += body.query.length;
        }
      }
    }
  }
  return results;
}
var init_search = __esm({
  "src/api/routes/search.ts"() {
    init_types();
  }
});

// src/api/routes/encrypt.ts
var encrypt_exports = {};
__export(encrypt_exports, {
  handleEncryptRequest: () => handleEncryptRequest
});
async function handleEncryptRequest(body, operation) {
  if (operation === "encrypt") {
    return await handleEncrypt(body);
  } else {
    return await handleDecrypt(body);
  }
}
async function handleEncrypt(body) {
  if (!body.text || typeof body.text !== "string") {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Text is required and must be a string",
      400
    );
  }
  if (body.text.length > 1e6) {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Text too large (max 1MB)",
      400
    );
  }
  const password = body.password || "default-api-password";
  if (!password || password.length < 8) {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Password must be at least 8 characters",
      400
    );
  }
  try {
    const ciphertext = await encrypt(body.text, password);
    return {
      ciphertext,
      algorithm: "AES-GCM"
    };
  } catch (error) {
    throw new ApiError(
      "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}
async function handleDecrypt(body) {
  if (!body.ciphertext || typeof body.ciphertext !== "string") {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Ciphertext is required and must be a string",
      400
    );
  }
  if (!body.password || typeof body.password !== "string") {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Password is required",
      400
    );
  }
  if (body.password.length < 8) {
    throw new ApiError(
      "INVALID_REQUEST" /* INVALID_REQUEST */,
      "Password must be at least 8 characters",
      400
    );
  }
  try {
    const plaintext = await decrypt(body.ciphertext, body.password);
    return {
      plaintext
    };
  } catch (error) {
    throw new ApiError(
      "DECRYPTION_FAILED" /* DECRYPTION_FAILED */,
      `Decryption failed: ${error instanceof Error ? error.message : "Invalid password or corrupted data"}`,
      400
    );
  }
}
var init_encrypt = __esm({
  "src/api/routes/encrypt.ts"() {
    init_crypto();
    init_types();
  }
});

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PiiLockPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/settings.ts
var import_obsidian3 = require("obsidian");
init_types();
var DEFAULT_SETTINGS = {
  patterns: ["\\d{6}-\\d{7}", "\\d{3}-\\d{4}-\\d{4}"],
  // Social Security Number-Phone Number Example
  patternMetadata: [
    { pattern: "\\d{6}-\\d{7}", source: "user", displayName: "User Pattern 1" },
    { pattern: "\\d{3}-\\d{4}-\\d{4}", source: "user", displayName: "User Pattern 2" }
  ],
  encryptAlgo: "AES-GCM",
  storedPassword: void 0,
  defaultPatterns: "",
  // Will be loaded from external file
  selectedCountries: [],
  // No countries selected by default
  api: DEFAULT_API_SETTINGS,
  apiKeys: ""
};
async function loadDefaultPatternsFromFile(plugin) {
  try {
    const adapter = plugin.app.vault.adapter;
    const pluginDir = plugin.manifest.dir || "";
    const filePath = `${pluginDir}/default-patterns.ini`;
    const content = await adapter.read(filePath);
    return content;
  } catch (error) {
    console.warn("Could not load default-patterns.ini, using empty patterns:", error);
    return "";
  }
}
function parseDefaultPatterns(iniString) {
  const result = {};
  const lines = iniString.split("\n");
  let currentSection = "";
  const countryDisplayNames = {
    "US": "United States",
    "Korea": "South Korea",
    "Japan": "Japan",
    "Taiwan": "Taiwan",
    "India": "India",
    "None": "No Default Pattern"
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed)
      continue;
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = {
        displayName: countryDisplayNames[currentSection] || currentSection,
        name: "",
        address: "",
        phone: ""
      };
    } else if (currentSection && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (key === "name") {
        result[currentSection].name = value;
      } else if (key === "address") {
        result[currentSection].address = value;
      } else if (key === "phone") {
        result[currentSection].phone = value;
      }
    }
  }
  return result;
}
function serializeDefaultPatterns(patterns) {
  let result = "";
  for (const [country, pattern] of Object.entries(patterns)) {
    result += `[${country}]
`;
    result += `name=${pattern.name}
`;
    result += `address=${pattern.address}
`;
    result += `phone=${pattern.phone}
`;
    if (Object.keys(patterns).indexOf(country) < Object.keys(patterns).length - 1) {
      result += "\n";
    }
  }
  return result;
}
async function saveDefaultPatternsToFile(plugin, content) {
  try {
    const adapter = plugin.app.vault.adapter;
    const pluginDir = plugin.manifest.dir || "";
    const filePath = `${pluginDir}/default-patterns.ini`;
    await adapter.write(filePath, content);
  } catch (error) {
    console.error("Could not save default-patterns.ini:", error);
    new import_obsidian3.Notice("Failed to save default patterns file");
  }
}
async function updatePatternInINI(plugin, oldPattern, newPattern, source, defaultPatterns) {
  if (source !== "user") {
    const countryPattern = defaultPatterns[source];
    if (countryPattern) {
      let updated = false;
      if (countryPattern.name) {
        const namePatterns = countryPattern.name.split("|").filter((p) => p.trim());
        const nameIndex = namePatterns.indexOf(oldPattern);
        if (nameIndex !== -1) {
          namePatterns[nameIndex] = newPattern;
          countryPattern.name = namePatterns.join("|");
          updated = true;
        }
      }
      if (!updated && countryPattern.address) {
        const addressPatterns = countryPattern.address.split("|").filter((p) => p.trim());
        const addressIndex = addressPatterns.indexOf(oldPattern);
        if (addressIndex !== -1) {
          addressPatterns[addressIndex] = newPattern;
          countryPattern.address = addressPatterns.join("|");
          updated = true;
        }
      }
      if (!updated && countryPattern.phone) {
        const phonePatterns = countryPattern.phone.split("|").filter((p) => p.trim());
        const phoneIndex = phonePatterns.indexOf(oldPattern);
        if (phoneIndex !== -1) {
          phonePatterns[phoneIndex] = newPattern;
          countryPattern.phone = phonePatterns.join("|");
          updated = true;
        }
      }
      if (updated) {
        const serialized = serializeDefaultPatterns(defaultPatterns);
        await saveDefaultPatternsToFile(plugin, serialized);
      }
    }
  }
}
var PiiSettingTab = class extends import_obsidian3.PluginSettingTab {
  // Track the open state
  constructor(app, plugin) {
    super(app, plugin);
    this.managePatternsSectionOpen = true;
    this.plugin = plugin;
  }
  async handlePasswordChange() {
    const { PwModal: PwModal2 } = await Promise.resolve().then(() => (init_LnFSidebarView(), LnFSidebarView_exports));
    const modal = new PwModal2(this.app, "Set Encryption Password", true);
    const password = await modal.wait();
    if (password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      this.plugin.settings.storedPassword = hashHex;
      await this.plugin.saveSettings();
      new import_obsidian3.Notice("Password saved successfully");
    }
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    void this.renderContent();
  }
  async renderContent() {
    const { containerEl } = this;
    containerEl.addClass("pii-settings-container");
    const patternsHeader = containerEl.createEl("details");
    patternsHeader.open = this.managePatternsSectionOpen;
    patternsHeader.createEl("summary", { text: "Manage patterns", cls: "pii-collapsible-header" });
    const patternsContainer = patternsHeader.createDiv("pii-patterns-container");
    patternsHeader.addEventListener("toggle", () => {
      this.managePatternsSectionOpen = patternsHeader.open;
    });
    const defaultPatternsContent = await loadDefaultPatternsFromFile(this.plugin);
    const defaultPatterns = parseDefaultPatterns(defaultPatternsContent);
    if (!this.plugin.settings.patternMetadata) {
      this.plugin.settings.patternMetadata = [];
      let userPatternCount = 1;
      for (const pattern of this.plugin.settings.patterns) {
        this.plugin.settings.patternMetadata.push({
          pattern,
          source: "user",
          displayName: `User Pattern ${userPatternCount}`
        });
        userPatternCount++;
      }
      await this.plugin.saveSettings();
    }
    this.plugin.settings.patternMetadata.forEach((patternMeta, idx) => {
      const s = new import_obsidian3.Setting(patternsContainer).setName(patternMeta.displayName).addText(
        (t) => t.setPlaceholder("\\d{6}-...").setValue(patternMeta.pattern).onChange(async (v) => {
          const oldPattern = patternMeta.pattern;
          this.plugin.settings.patterns[idx] = v;
          this.plugin.settings.patternMetadata[idx].pattern = v;
          await updatePatternInINI(this.plugin, oldPattern, v, patternMeta.source, defaultPatterns);
          await this.plugin.saveSettings();
        })
      ).addExtraButton(
        (btn) => btn.setIcon("trash").setTooltip("Remove").onClick(async () => {
          this.plugin.settings.patterns.splice(idx, 1);
          this.plugin.settings.patternMetadata.splice(idx, 1);
          if (patternMeta.source !== "user") {
            const remainingCountryPatterns = this.plugin.settings.patternMetadata.filter((p) => p.source === patternMeta.source);
            if (remainingCountryPatterns.length === 0) {
              this.plugin.settings.selectedCountries = this.plugin.settings.selectedCountries.filter((c) => c !== patternMeta.source);
            }
          }
          await this.plugin.saveSettings();
          this.display();
        })
      );
      if (this.plugin.settings.patterns.length === 1) {
        const button = s.controlEl.querySelector("button");
        if (button)
          button.disabled = true;
      }
    });
    new import_obsidian3.Setting(patternsContainer).addButton(
      (btn) => btn.setButtonText("+").setTooltip("Add pattern").setCta().onClick(async () => {
        const userPatternCount = this.plugin.settings.patternMetadata.filter((p) => p.source === "user").length + 1;
        this.plugin.settings.patterns.push("");
        this.plugin.settings.patternMetadata.push({
          pattern: "",
          source: "user",
          displayName: `User Pattern ${userPatternCount}`
        });
        await this.plugin.saveSettings();
        this.display();
      })
    );
    containerEl.createEl("hr");
    const availableCountries = Object.keys(defaultPatterns).filter((c) => c !== "None");
    const selectedCountries = this.plugin.settings.selectedCountries;
    const selectedCountryNames = selectedCountries.map((c) => defaultPatterns[c]?.displayName || c).join(", ");
    new import_obsidian3.Setting(containerEl).setName("Add country patterns").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Selected countries").setDesc(selectedCountries.length > 0 ? selectedCountryNames : "No countries selected").addButton(
      (btn) => btn.setButtonText("Clear all").onClick(async () => {
        this.plugin.settings.selectedCountries = [];
        const userPatterns = this.plugin.settings.patternMetadata.filter((p) => p.source === "user");
        this.plugin.settings.patterns = userPatterns.map((p) => p.pattern);
        this.plugin.settings.patternMetadata = userPatterns;
        await this.plugin.saveSettings();
        new import_obsidian3.Notice("Cleared all selected countries");
        this.display();
      })
    );
    const countryButtonsContainer = containerEl.createDiv("pii-country-buttons");
    availableCountries.forEach((country) => {
      const pattern = defaultPatterns[country];
      const isSelected = this.plugin.settings.selectedCountries.includes(country);
      new import_obsidian3.Setting(countryButtonsContainer).setName(pattern.displayName).setDesc(`Add patterns for ${pattern.displayName}`).addButton(
        (btn) => btn.setButtonText(isSelected ? "Remove" : "Add").setClass(isSelected ? "mod-warning" : "mod-cta").onClick(async () => {
          const currentlySelected = this.plugin.settings.selectedCountries.includes(country);
          if (currentlySelected) {
            this.plugin.settings.selectedCountries = this.plugin.settings.selectedCountries.filter((c) => c !== country);
            const allCountryPatterns = [];
            if (pattern.name) {
              const namePatterns = pattern.name.split("|").filter((p) => p.trim());
              allCountryPatterns.push(...namePatterns);
            }
            if (pattern.address) {
              const addressPatterns = pattern.address.split("|").filter((p) => p.trim());
              allCountryPatterns.push(...addressPatterns);
            }
            if (pattern.phone) {
              const phonePatterns = pattern.phone.split("|").filter((p) => p.trim());
              allCountryPatterns.push(...phonePatterns);
            }
            this.plugin.settings.patterns = this.plugin.settings.patterns.filter((p) => !allCountryPatterns.includes(p));
            this.plugin.settings.patternMetadata = this.plugin.settings.patternMetadata.filter((p) => p.source !== country);
            new import_obsidian3.Notice(`Removed ${pattern.displayName} patterns`);
          } else {
            if (!this.plugin.settings.selectedCountries.includes(country)) {
              this.plugin.settings.selectedCountries.push(country);
            } else {
              new import_obsidian3.Notice(`${pattern.displayName} is already selected`);
              return;
            }
            if (pattern.name) {
              const namePatterns = pattern.name.split("|").filter((p) => p.trim());
              this.plugin.settings.patterns = [...this.plugin.settings.patterns, ...namePatterns];
              namePatterns.forEach((namePattern, index) => {
                this.plugin.settings.patternMetadata.push({
                  pattern: namePattern,
                  source: country,
                  displayName: `${country} Name ${index + 1}`
                });
              });
            }
            if (pattern.address) {
              const addressPatterns = pattern.address.split("|").filter((p) => p.trim());
              this.plugin.settings.patterns = [...this.plugin.settings.patterns, ...addressPatterns];
              addressPatterns.forEach((addressPattern, index) => {
                this.plugin.settings.patternMetadata.push({
                  pattern: addressPattern,
                  source: country,
                  displayName: `${country} Address ${index + 1}`
                });
              });
            }
            if (pattern.phone) {
              const phonePatterns = pattern.phone.split("|").filter((p) => p.trim());
              this.plugin.settings.patterns = [...this.plugin.settings.patterns, ...phonePatterns];
              phonePatterns.forEach((phonePattern, index) => {
                this.plugin.settings.patternMetadata.push({
                  pattern: phonePattern,
                  source: country,
                  displayName: `${country} Phone ${index + 1}`
                });
              });
            }
            new import_obsidian3.Notice(`Added ${pattern.displayName} patterns`);
          }
          await this.plugin.saveSettings();
          this.display();
        })
      );
    });
    containerEl.createEl("hr");
    new import_obsidian3.Setting(containerEl).setName("Default patterns").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Create default patterns file").setDesc("Create the default-patterns.ini file with standard country patterns").addButton(
      (btn) => btn.setButtonText("Create file").setCta().onClick(async () => {
        const defaultContent = `[US]
name=[A-Z][a-z]+\\s[A-Z][a-z]+|[A-Z][a-z]+\\s[A-Z]\\.\\s[A-Z][a-z]+
address=\\d{3}-\\d{2}-\\d{4}
phone=\\d{3}-\\d{3}-\\d{4}|\\(\\d{3}\\)\\s\\d{3}-\\d{4}|\\+1\\s\\d{3}\\s\\d{3}\\s\\d{4}

[Korea]
name=[\uAC00-\uD7A3]{2,4}|[A-Z][a-z]+\\s[A-Z][a-z]+
address=\\d{6}-\\d{7}
phone=010[- ]?\\d{4}[- ]?\\d{4}|\\+82\\s\\d{2}\\s\\d{4}\\s\\d{4}

[Japan]
name=[\u3072\u3089\u304C\u306A-\u30AB\u30BF\u30AB\u30CA\u4E00-\u9FAF]{2,6}|[A-Z][a-z]+\\s[A-Z][a-z]+
address=\\d{3}-\\d{4}|\\d{7}
phone=\\d{3}-\\d{4}-\\d{4}|\\d{4}-\\d{2}-\\d{4}|\\+81\\s\\d{3}\\s\\d{4}\\s\\d{4}

[Taiwan]
name=[\u4E00-\u9FAF]{2,4}|[A-Z][a-z]+\\s[A-Z][a-z]+
address=\\d{8}|\\d{10}
phone=\\d{4}-\\d{3}-\\d{3}|\\d{2}-\\d{8}|\\+886\\s\\d{3}\\s\\d{3}\\s\\d{3}

[India]
name=[A-Z][a-z]+\\s[A-Z][a-z]+|[\u0905-\u0939]{2,6}
address=\\d{4}\\s\\d{4}\\s\\d{4}
phone=\\d{3}-\\d{3}-\\d{4}|\\+91\\s\\d{5}\\s\\d{5}|\\d{10}

[None]
name=
address=
phone=
`;
        try {
          await saveDefaultPatternsToFile(this.plugin, defaultContent);
          new import_obsidian3.Notice("Default patterns file created successfully!");
          this.display();
        } catch (error) {
          console.error("Failed to create default patterns file:", error);
          new import_obsidian3.Notice("Failed to create default patterns file");
        }
      })
    );
    containerEl.createEl("hr");
    new import_obsidian3.Setting(containerEl).setName("Password management").setHeading();
    const hasStoredPassword = !!this.plugin.settings.storedPassword;
    const statusText = hasStoredPassword ? "Password is currently stored" : "No password stored";
    containerEl.createEl("p", {
      text: statusText,
      cls: hasStoredPassword ? "pii-password-status-active" : "pii-password-status-inactive"
    });
    new import_obsidian3.Setting(containerEl).setName(hasStoredPassword ? "Change Password" : "Set Password").setDesc(hasStoredPassword ? "Update your encryption password" : "Set a password for encryption operations").addButton(
      (btn) => btn.setButtonText(hasStoredPassword ? "Change" : "Set").setCta().onClick(async () => {
        await this.handlePasswordChange();
        this.display();
      })
    );
    if (hasStoredPassword) {
      new import_obsidian3.Setting(containerEl).setName("Clear stored password").setDesc("Remove the stored password. You will be prompted for password on each operation.").addButton(
        (btn) => btn.setButtonText("Clear").setWarning().onClick(async () => {
          this.plugin.settings.storedPassword = void 0;
          await this.plugin.saveSettings();
          new import_obsidian3.Notice("Password cleared successfully");
          this.display();
        })
      );
    }
    containerEl.createEl("hr");
    new import_obsidian3.Setting(containerEl).setName("API settings").setDesc("Enable external API access for programmatic search and encryption operations").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Enable API server").setDesc("Allow external applications to access Lock & Find via REST API").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.api.enabled).onChange(async (value) => {
        this.plugin.settings.api.enabled = value;
        await this.plugin.saveSettings();
        if (value) {
          this.plugin.startApiServer();
          new import_obsidian3.Notice("API server started");
        } else {
          this.plugin.stopApiServer();
          new import_obsidian3.Notice("API server stopped");
        }
        this.display();
      })
    );
    if (this.plugin.settings.api.enabled) {
      new import_obsidian3.Setting(containerEl).setName("API port").setDesc("Port number for the API server (requires restart)").addText(
        (text) => text.setPlaceholder("27750").setValue(String(this.plugin.settings.api.port)).onChange(async (value) => {
          const port = parseInt(value);
          if (port > 0 && port < 65536) {
            this.plugin.settings.api.port = port;
            await this.plugin.saveSettings();
          }
        })
      );
      new import_obsidian3.Setting(containerEl).setName("Rate limit").setDesc("Maximum requests per minute per API key").addText(
        (text) => text.setPlaceholder("100").setValue(String(this.plugin.settings.api.rateLimit.maxRequests)).onChange(async (value) => {
          const limit = parseInt(value);
          if (limit > 0) {
            this.plugin.settings.api.rateLimit.maxRequests = limit;
            await this.plugin.saveSettings();
          }
        })
      );
      new import_obsidian3.Setting(containerEl).setName("Log API requests").setDesc("Keep a log of all API requests for debugging").addToggle(
        (toggle) => toggle.setValue(this.plugin.settings.api.logRequests).onChange(async (value) => {
          this.plugin.settings.api.logRequests = value;
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian3.Setting(containerEl).setName("API keys").setDesc("Manage API keys for authentication").addButton(
        (btn) => btn.setButtonText("Manage keys").setCta().onClick(async () => {
          const { ApiKeyModal: ApiKeyModal2 } = await Promise.resolve().then(() => (init_ApiKeyModal(), ApiKeyModal_exports));
          new ApiKeyModal2(this.app, this.plugin).open();
        })
      );
      const apiServer = this.plugin.getApiServer();
      const isRunning = apiServer?.isServerRunning() || false;
      const statusText2 = isRunning ? "\u2705 API Server Running" : "\u2B55 API Server Stopped";
      containerEl.createEl("p", {
        text: statusText2,
        cls: isRunning ? "pii-status-active" : "pii-status-inactive"
      });
    }
  }
};

// src/commands.ts
init_scanner();

// ui/ResultsModal.ts
var import_obsidian4 = require("obsidian");
var ResultsModal = class extends import_obsidian4.Modal {
  constructor(app, matches) {
    super(app);
    this.matches = matches;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pii-modal");
    contentEl.createEl("h3", { text: `PII matches (${this.matches.length})` });
    if (!this.matches.length) {
      contentEl.createEl("p", { text: "No PII found" });
      return;
    }
    const list = contentEl.createEl("div", { cls: "pii-list" });
    this.matches.forEach((m, idx) => {
      const item = list.createEl("div", { cls: "pii-item" });
      const cb = item.createEl("input", { type: "checkbox" });
      cb.checked = true;
      item.createEl("span", {
        text: `${m.text}  \u2014  ${m.file.basename}:${m.line + 1}`,
        cls: "pii-text"
      });
      const goBtn = item.createEl("button", { text: "Open" });
      goBtn.onclick = () => this.openAtPosition(m);
    });
    contentEl.createEl("button", {
      text: "Close",
      cls: "mod-cta"
    }).onclick = () => this.close();
  }
  /** Open the same file and move cursor */
  async openAtPosition(m) {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(m.file);
    const view = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (view)
      view.editor.setCursor({ line: m.line, ch: m.col });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/commands.ts
function registerCommands(plugin) {
  plugin.addCommand({
    id: "pii-scan",
    name: "PII scan",
    callback: async () => {
      const results = await scanVault(plugin);
      new ResultsModal(plugin.app, results).open();
    }
  });
  plugin.addCommand({
    id: "pii-lock",
    name: "PII lock (encrypt)",
    callback: () => {
    }
  });
  plugin.addCommand({
    id: "pii-unlock",
    name: "PII unlock (decrypt)",
    callback: () => {
    }
  });
}

// main.ts
init_LnFSidebarView();

// src/api/keyManager.ts
var ApiKeyManager = class {
  constructor(saveCallback) {
    this.saveCallback = saveCallback;
    this.keys = /* @__PURE__ */ new Map();
  }
  /**
   * Generate a cryptographically secure API key
   * Format: lnf_<32 random hex chars>
   */
  async generateKey(name) {
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const rawKey = `lnf_${Array.from(keyBytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
    const keyHash = await this.hashKey(rawKey);
    const keyInfo = {
      id: this.generateId(),
      name,
      keyHash,
      createdAt: Date.now(),
      usageCount: 0,
      enabled: true
    };
    this.keys.set(keyInfo.id, keyInfo);
    await this.saveCallback();
    return rawKey;
  }
  /**
   * Validate an API key using constant-time comparison
   */
  async validateKey(rawKey) {
    if (!rawKey || !rawKey.startsWith("lnf_")) {
      return null;
    }
    const targetHash = await this.hashKey(rawKey);
    for (const keyInfo of this.keys.values()) {
      if (!keyInfo.enabled)
        continue;
      if (this.constantTimeCompare(targetHash, keyInfo.keyHash)) {
        keyInfo.lastUsed = Date.now();
        keyInfo.usageCount++;
        await this.saveCallback();
        return keyInfo;
      }
    }
    return null;
  }
  /**
   * Revoke an API key by ID
   */
  async revokeKey(keyId) {
    const keyInfo = this.keys.get(keyId);
    if (!keyInfo)
      return false;
    keyInfo.enabled = false;
    await this.saveCallback();
    return true;
  }
  /**
   * Delete an API key permanently
   */
  async deleteKey(keyId) {
    const deleted = this.keys.delete(keyId);
    if (deleted) {
      await this.saveCallback();
    }
    return deleted;
  }
  /**
   * List all API keys (without sensitive data)
   */
  listKeys() {
    return Array.from(this.keys.values()).map((key) => ({
      ...key,
      keyHash: "[REDACTED]"
    }));
  }
  /**
   * Get key by ID
   */
  getKey(keyId) {
    return this.keys.get(keyId);
  }
  /**
   * Load keys from serialized data
   */
  loadKeys(keysData) {
    this.keys.clear();
    keysData.forEach((key) => {
      this.keys.set(key.id, key);
    });
  }
  /**
   * Serialize keys for storage
   */
  serializeKeys() {
    return Array.from(this.keys.values());
  }
  /**
   * Hash an API key using SHA-256 with multiple rounds
   */
  async hashKey(key) {
    const encoder = new TextEncoder();
    let hash = await crypto.subtle.digest("SHA-256", encoder.encode(key));
    for (let i = 0; i < 1e4; i++) {
      hash = await crypto.subtle.digest("SHA-256", hash);
    }
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Constant-time string comparison to prevent timing attacks
   */
  constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      let result2 = 0;
      for (let i = 0; i < a.length; i++) {
        result2 |= a.charCodeAt(i) ^ b.charCodeAt(i % b.length);
      }
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  /**
   * Generate a unique ID for a key
   */
  generateId() {
    return `key_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
};

// src/api/server.ts
init_types();
var LnFApiServer = class {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.requestLogs = [];
    this.rateLimitMap = /* @__PURE__ */ new Map();
    this.server = null;
    this.isRunning = false;
    this.keyManager = new ApiKeyManager(async () => {
      await this.plugin.saveSettings();
    });
  }
  /**
   * Start the API server
   */
  start(settings) {
    if (this.isRunning) {
      console.warn("API server already running");
      return;
    }
    if (this.plugin.settings.apiKeys) {
      this.keyManager.loadKeys(this.plugin.settings.apiKeys);
    }
    console.debug(`API server started on port ${settings.port}`);
    console.debug(`TLS enabled: ${!!settings.tlsCertPath}`);
    console.debug(`Rate limit: ${settings.rateLimit.maxRequests} requests per ${settings.rateLimit.windowMs}ms`);
    this.isRunning = true;
  }
  /**
   * Stop the API server
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.isRunning = false;
    console.debug("API server stopped");
  }
  /**
   * Handle incoming API request (called by Obsidian's request handler)
   */
  async handleRequest(method, path, headers, body) {
    const startTime = Date.now();
    let keyId = "unknown";
    try {
      const apiKey = headers["x-api-key"] || headers["X-API-Key"];
      if (!apiKey) {
        throw new ApiError(
          "UNAUTHORIZED" /* UNAUTHORIZED */,
          "Missing API key",
          401
        );
      }
      const keyInfo = await this.keyManager.validateKey(apiKey);
      if (!keyInfo) {
        throw new ApiError(
          "UNAUTHORIZED" /* UNAUTHORIZED */,
          "Invalid API key",
          401
        );
      }
      keyId = keyInfo.id;
      if (!this.checkRateLimit(keyId)) {
        throw new ApiError(
          "RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */,
          "Rate limit exceeded",
          429
        );
      }
      const result = await this.routeRequest(method, path, body);
      this.logRequest({
        id: this.generateLogId(),
        timestamp: Date.now(),
        method,
        path,
        keyId,
        statusCode: 200,
        duration: Date.now() - startTime
      });
      return {
        success: true,
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logRequest({
        id: this.generateLogId(),
        timestamp: Date.now(),
        method,
        path,
        keyId,
        statusCode,
        duration: Date.now() - startTime,
        error: errorMessage
      });
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }
  /**
   * Route request to appropriate handler
   */
  async routeRequest(method, path, body) {
    const { handleSearchRequest: handleSearchRequest2 } = await Promise.resolve().then(() => (init_search(), search_exports));
    const { handleEncryptRequest: handleEncryptRequest2 } = await Promise.resolve().then(() => (init_encrypt(), encrypt_exports));
    if (method === "POST" && path === "/api/search/regex") {
      return await handleSearchRequest2(this.app, body, "regex");
    }
    if (method === "POST" && path === "/api/search/direct") {
      return await handleSearchRequest2(this.app, body, "direct");
    }
    if (method === "POST" && path === "/api/encrypt") {
      return await handleEncryptRequest2(body, "encrypt");
    }
    if (method === "POST" && path === "/api/decrypt") {
      return await handleEncryptRequest2(body, "decrypt");
    }
    if (method === "GET" && path === "/api/health") {
      return {
        status: "ok",
        version: this.plugin.manifest.version,
        uptime: Date.now()
      };
    }
    throw new ApiError(
      "NOT_FOUND" /* NOT_FOUND */,
      `Route not found: ${method} ${path}`,
      404
    );
  }
  /**
   * Check rate limit for a key
   */
  checkRateLimit(keyId) {
    const settings = this.plugin.settings.api;
    const now = Date.now();
    const windowMs = settings.rateLimit.windowMs;
    const maxRequests = settings.rateLimit.maxRequests;
    let requests = this.rateLimitMap.get(keyId) || [];
    requests = requests.filter((timestamp) => now - timestamp < windowMs);
    if (requests.length >= maxRequests) {
      return false;
    }
    requests.push(now);
    this.rateLimitMap.set(keyId, requests);
    return true;
  }
  /**
   * Log API request
   */
  logRequest(log) {
    if (!this.plugin.settings.api.logRequests) {
      return;
    }
    this.requestLogs.push(log);
    if (this.requestLogs.length > 1e3) {
      this.requestLogs = this.requestLogs.slice(-1e3);
    }
    console.debug(
      `[API] ${log.method} ${log.path} - ${log.statusCode} (${log.duration}ms)${log.error ? ` - ${log.error}` : ""}`
    );
  }
  /**
   * Get request logs
   */
  getRequestLogs(limit = 100) {
    return this.requestLogs.slice(-limit);
  }
  /**
   * Clear request logs
   */
  clearRequestLogs() {
    this.requestLogs = [];
  }
  /**
   * Get key manager for external access
   */
  getKeyManager() {
    return this.keyManager;
  }
  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  /**
   * Check if server is running
   */
  isServerRunning() {
    return this.isRunning;
  }
};

// main.ts
var PiiLockPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.apiServer = null;
  }
  /* ──────────── Lifecycle ──────────── */
  async onload() {
    await this.loadSettings();
    this.apiServer = new LnFApiServer(this.app, this);
    if (this.settings.api.enabled) {
      this.startApiServer();
    }
    this.registerView(
      VIEW_TYPE_PII,
      (leaf) => new LnFSidebarView(leaf, this)
    );
    this.addRibbonIcon("shield", "Lock and find", () => this.activateSidebar());
    this.addSettingTab(new PiiSettingTab(this.app, this));
    registerCommands(this);
  }
  onunload() {
    if (this.apiServer) {
      this.stopApiServer();
    }
  }
  /* ──────────── Helpers ──────────── */
  async activateSidebar() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PII);
    if (leaves.length > 0) {
      await this.app.workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = this.app.workspace.getLeftLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_PII,
      active: true
    });
    await this.app.workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  /* ──────────── API Server Methods ──────────── */
  startApiServer() {
    if (!this.apiServer) {
      console.error("API server not initialized");
      return;
    }
    this.apiServer.start(this.settings.api);
  }
  stopApiServer() {
    if (!this.apiServer) {
      return;
    }
    this.apiServer.stop();
  }
  getApiServer() {
    return this.apiServer;
  }
};
