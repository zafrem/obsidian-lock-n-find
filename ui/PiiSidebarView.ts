import {
  ItemView, WorkspaceLeaf, MarkdownView,
  Modal, Setting, Notice
} from "obsidian";
import type PiiLockPlugin from "../main";
import { scanVault, MatchInfo } from "../src/scanner";
import { encrypt, decrypt } from "../src/crypto";

export const VIEW_TYPE_PII = "pii-sidebar-view";
const makeUUID = () =>
  (crypto as any).randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/* Password Modal with improved UI */
export class PwModal extends Modal {
  private _resolve!: (v: string | null) => void;
  constructor(app: any, private title: string, private isEncrypt: boolean = false) { super(app); }

  onOpen() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("pii-modal");
    
    // Create a content container with proper spacing
    const contentContainer = containerEl.createDiv({
      cls: "pii-modal-content"
    });
    
    // Add title with icon
    const titleEl = contentContainer.createEl("h3", {
      cls: "pii-modal-title"
    });
    const icon = this.isEncrypt ? "🔒" : "🔓";
    titleEl.innerHTML = `${icon} ${this.title}`;
    
    // Add description
    const description = this.isEncrypt 
      ? "Enter a password to encrypt your sensitive information. Remember this password as you'll need it to decrypt later."
      : "Enter your password to decrypt the protected information.";
    
    contentContainer.createEl("p", { 
      text: description,
      cls: "pii-modal-description"
    });
  
    let pw = "";
    let showPassword = false;
    
    // Create form container
    const formContainer = contentContainer.createDiv({
      cls: "pii-modal-form"
    });
    
    // Password field container
    const pwContainer = formContainer.createDiv({
      cls: "pii-password-container"
    });
    
    // Password label
    pwContainer.createEl("label", {
      text: "Password",
      cls: "pii-input-label"
    });
    
    // Password input wrapper for positioning the toggle button
    const pwInputWrapper = pwContainer.createDiv({
      cls: "pii-input-wrapper"
    });
    
    // Password input
    const pwInput = pwInputWrapper.createEl("input", {
      type: "password",
      placeholder: this.isEncrypt ? "Create a strong password" : "Enter your password",
      cls: "pii-password-input"
    });
    
    pwInput.addEventListener("input", (e) => {
      pw = (e.target as HTMLInputElement).value;
    });
    
    // Focus on the input when modal opens
    pwInput.focus();
    
    // Handle Enter key
    pwInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        if (this.isEncrypt) {
          this.validateAndSubmit(pw, confirmPw);
        } else {
          this.submit(pw);
        }
      }
    });
    
    // Add show/hide password toggle
    const toggleBtn = pwInputWrapper.createEl("button", {
      cls: "pii-password-toggle",
      text: "👁️" // Eye icon
    });
    
    toggleBtn.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      showPassword = !showPassword;
      pwInput.type = showPassword ? "text" : "password";
      toggleBtn.textContent = showPassword ? "👁️‍🗨️" : "👁️"; // Eye with slash when hidden
    });
    
    // Add confirmation field if encrypting
    let confirmPw = "";
    let confirmInput: HTMLInputElement | null = null;
    if (this.isEncrypt) {
      const confirmContainer = formContainer.createDiv({
        cls: "pii-password-container"
      });
      confirmContainer.createEl("label", {
        text: "Confirm Password",
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
        confirmPw = (e.target as HTMLInputElement).value;
      });
      
      // Handle Enter key for confirmation field
      confirmInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          this.validateAndSubmit(pw, confirmPw);
        }
      });
      
      // Add show/hide password toggle for confirmation
      const confirmToggleBtn = confirmInputWrapper.createEl("button", {
        cls: "pii-password-toggle",
        text: "👁️" // Eye icon
      });
      
      confirmToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showPassword = !showPassword;
        if (confirmInput) {
          confirmInput.type = showPassword ? "text" : "password";
        }
        confirmToggleBtn.textContent = showPassword ? "👁️‍🗨️" : "👁️";
        pwInput.type = showPassword ? "text" : "password";
        toggleBtn.textContent = showPassword ? "👁️‍🗨️" : "👁️";
      });
    }
    
    // Button container
    const buttonContainer = contentContainer.createDiv({
      cls: "pii-modal-buttons"
    });
    
    // Cancel button
    const cancelBtn = buttonContainer.createEl("button", {
      text: "Cancel",
      cls: "pii-btn-secondary"
    });
    
    cancelBtn.onclick = () => this.close();
    
    // Submit button
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

  private validateAndSubmit(pw: string, confirmPw: string) {
    if (!pw) {
      new Notice("Please enter a password");
      return;
    }
    
    if (this.isEncrypt && pw !== confirmPw) {
      new Notice("Passwords do not match");
      return;
    }
    
    this.submit(pw);
  }

  private submit(pw: string) {
    this.close();
    this._resolve(pw || null);
  }

  onClose() { this.contentEl.empty(); }
  
  wait(): Promise<string | null> {
    this.open();
    return new Promise(res => (this._resolve = res));
  }
}


/* ── 사이드바 뷰 ─ */
export class PiiSidebarView extends ItemView {
  private matches: MatchInfo[] = [];
  private searchResults: MatchInfo[] = [];
  private manualSelections: {text: string, id: string}[] = [];
  private selected: Set<number> = new Set();
  private cachedPassword: string | null = null;
  private currentMode: 'scan' | 'search' = 'scan';
  constructor(leaf: WorkspaceLeaf, private plugin:PiiLockPlugin){super(leaf);}
  getViewType(){return VIEW_TYPE_PII;}
  getDisplayText(){return "PII Scan";}
  getIcon(){return "shield";}

  async onOpen(){
    const e=this.containerEl; e.empty();
    
    // Set up global text selection listeners for drag and drop
    this.setupTextSelectionDragDrop();

    // Mode toggle buttons
    const modeContainer = e.createEl("div", {cls: "pii-mode-toggle"});
    const scanModeBtn = modeContainer.createEl("button", {
      cls: this.currentMode === 'scan' ? "pii-btn-primary" : "pii-btn-secondary",
      text: "Scan Mode"
    });
    const searchModeBtn = modeContainer.createEl("button", {
      cls: this.currentMode === 'search' ? "pii-btn-primary" : "pii-btn-secondary", 
      text: "Search Mode"
    });

    scanModeBtn.onclick = () => {
      this.currentMode = 'scan';
      scanModeBtn.className = "pii-btn-primary";
      searchModeBtn.className = "pii-btn-secondary";
      this.render();
    };

    searchModeBtn.onclick = () => {
      this.currentMode = 'search';
      scanModeBtn.className = "pii-btn-secondary";
      searchModeBtn.className = "pii-btn-primary";
      this.render();
    };

    // Scan controls (only show in scan mode)
    const scanControls = e.createEl("div", {cls: "pii-scan-controls"});
    
    // Scan button with icon
    const scan = scanControls.createEl("button", {cls: "pii-btn-primary pii-btn-half"});
    scan.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M5,3H19C20.11,3 21,3.89 21,5V13.03C20.5,12.23 19.81,11.54 19,11V5H5V19H9.5C9.81,19.75 10.26,20.42 10.81,21H5C3.89,21 3,20.11 3,19V5C3,3.89 3.89,3 5,3M7,7H17V9H7V7M7,11H12.03C11.23,11.5 10.54,12.19 10,13H7V11M7,15H9.17C9.06,15.5 9,16 9,16.5V17H7V15Z"></path></svg> Scan Vault';
    
    // Clear button with icon
    const clear = scanControls.createEl("button", {cls: "pii-btn-secondary pii-btn-half"});
    clear.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></svg> Clear';
    
    scan.onclick = async () => {
      scan.disabled = true;
      scan.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite" /></path></svg> Scanning...';
      this.matches = await scanVault(this.plugin);
      this.selected.clear();
      this.render();
      scan.disabled = false;
      scan.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M5,3H19C20.11,3 21,3.89 21,5V13.03C20.5,12.23 19.81,11.54 19,11V5H5V19H9.5C9.81,19.75 10.26,20.42 10.81,21H5C3.89,21 3,20.11 3,19V5C3,3.89 3.89,3 5,3M7,7H17V9H7V7M7,11H12.03C11.23,11.5 10.54,12.19 10,13H7V11M7,15H9.17C9.06,15.5 9,16 9,16.5V17H7V15Z"></path></svg> Scan Vault';
    };
    
    clear.onclick = () => {
      this.matches = [];
      this.searchResults = [];
      this.manualSelections = [];
      this.selected.clear();
      this.render();
    };

    // Search input (only show in search mode)
    const searchContainer = e.createEl("div", {cls: "pii-search-container"});
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: "Search for text to encrypt...",
      cls: "pii-search-input"
    });
    
    const searchBtn = searchContainer.createEl("button", {cls: "pii-btn-primary"});
    searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14Z"></path></svg> Search';

    searchBtn.onclick = async () => {
      const query = searchInput.value.trim();
      if (!query) {
        new Notice("Please enter search text");
        return;
      }
      
      searchBtn.disabled = true;
      searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite" /></path></svg> Searching...';
      
      this.searchResults = await this.searchVault(query);
      this.selected.clear();
      this.render();
      
      searchBtn.disabled = false;
      searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14Z"></path></svg> Search';
    };

    // Handle Enter key in search input
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        searchBtn.click();
      }
    });

    e.createEl("hr");
    
    // Results list with better styling
    const listContainer = e.createEl("div",{cls:"pii-list"});
    
    // Drop area with icon and better instructions
    const dropArea = e.createEl("div",{cls:"pii-drop"});
    dropArea.createEl("div", {cls: "pii-drop-icon", text: ""});
    dropArea.createEl("div", {text: "Drag items here to encrypt"});

    /* Footer: Lock / Unlock buttons */
    const bot=e.createEl("div",{cls:"pii-btn-bar-bottom"});
    
    // Lock button with icon
    const lockBtn = bot.createEl("button",{cls:"pii-btn-primary pii-btn-half"});
    lockBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"></path></svg> Lock Selected';
    lockBtn.onclick=()=>this.lock();
    
    // Unlock button with icon
    const unlockBtn = bot.createEl("button",{cls:"pii-btn-secondary pii-btn-half"});
    unlockBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z"></path></svg> Unlock All';
    unlockBtn.onclick=()=>this.unlock();
  }
  async onClose(){
    this.containerEl.empty();
    this.cleanupTextSelectionDragDrop();
  }

  /* -------- Text Selection Drag & Drop Setup -------- */
  private setupTextSelectionDragDrop() {
    // Add event listeners to detect text selection and enable dragging
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('dragstart', this.handleDragStart.bind(this));
  }

  private cleanupTextSelectionDragDrop() {
    document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
    document.removeEventListener('dragstart', this.handleDragStart.bind(this));
  }

  private handleTextSelection(event: MouseEvent) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    // Check if the selection is within an editor
    const target = event.target as HTMLElement;
    const editorContainer = target.closest('.markdown-source-view, .cm-editor');
    if (!editorContainer) return;
    
    // Make the selected text draggable by creating a temporary draggable element
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    
    // Create a temporary draggable wrapper around the selection
    try {
      const span = document.createElement('span');
      span.draggable = true;
      span.style.backgroundColor = 'var(--text-selection)';
      span.style.cursor = 'grab';
      span.title = 'Drag to encrypt this text';
      
      // Store the selected text data for drag and drop
      span.setAttribute('data-selected-text', selectedText);
      
      range.surroundContents(span);
      
      // Remove the draggable wrapper after a short delay if not dragged
      setTimeout(() => {
        if (span && span.parentNode) {
          const parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      }, 5000);
      
    } catch (e) {
      console.log('Could not make selection draggable:', e);
    }
  }

  private handleDragStart(event: DragEvent) {
    const target = event.target as HTMLElement;
    const selectedText = target.getAttribute('data-selected-text');
    
    if (selectedText && event.dataTransfer) {
      event.dataTransfer.setData('text/plain', selectedText);
      event.dataTransfer.setData('application/x-selected-text', selectedText);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  /* -------- Search Vault -------- */
  private async searchVault(query: string): Promise<MatchInfo[]> {
    const results: MatchInfo[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let index = 0;
        
        // Find all occurrences of the query in this line
        while ((index = line.toLowerCase().indexOf(query.toLowerCase(), index)) !== -1) {
          const match: MatchInfo = {
            text: line.substring(index, index + query.length),
            file: file,
            line: i,
            col: index
          };
          results.push(match);
          index += query.length; // Move past this match to find next occurrence
        }
      }
    }
    
    return results;
  }

  /* -------- Render UI -------- */
  private render(){
    const list = this.containerEl.querySelector(".pii-list") as HTMLElement;
    const drop = this.containerEl.querySelector(".pii-drop") as HTMLElement;
    const searchContainer = this.containerEl.querySelector(".pii-search-container") as HTMLElement;
    const scanControls = this.containerEl.querySelector(".pii-scan-controls") as HTMLElement;
    const modeContainer = this.containerEl.querySelector(".pii-mode-toggle") as HTMLElement;
    
    // Show/hide controls based on mode
    if (searchContainer) {
      searchContainer.style.display = this.currentMode === 'search' ? 'flex' : 'none';
    }
    if (scanControls) {
      scanControls.style.display = this.currentMode === 'scan' ? 'flex' : 'none';
    }
    
    // Clear previous content
    list.empty();
    
    // Reset drop area
    drop.empty();
    drop.createEl("div", {cls: "pii-drop-icon", text: "🔒"});
    drop.createEl("div", {text: "Drag items here to encrypt"});

    // Get current results based on mode
    const currentResults = this.currentMode === 'scan' ? this.matches : this.searchResults;
    const emptyMessage = this.currentMode === 'scan' ? "No sensitive information found" : "No search results found";

    // Show empty state if no results
    if(!currentResults.length){
      list.createEl("div", {cls: "pii-empty"});
      list.createEl("div", {cls: "pii-empty"}).innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32" style="opacity: 0.5"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 12,10.5M7.5,10.5A1.5,1.5 0 0,0 6,12A1.5,1.5 0 0,0 7.5,13.5A1.5,1.5 0 0,0 9,12A1.5,1.5 0 0,0 7.5,10.5M16.5,10.5A1.5,1.5 0 0,0 15,12A1.5,1.5 0 0,0 16.5,13.5A1.5,1.5 0 0,0 18,12A1.5,1.5 0 0,0 16.5,10.5Z"></path></svg>';
      list.createEl("p", {text: emptyMessage});
      return;
    }

    // Create rows for each result
    currentResults.forEach((m,i)=>{
      const row = list.createEl("div", {cls: "pii-row"});
      
      // Add text content with ellipsis for long text
      const textEl = row.createEl("div", {cls: "pii-row-text", text: m.text});
      
      // Add file location info
      row.createEl("div", {cls: "pii-row-location", text: `${m.file.basename}:${m.line+1}`});
      
      // Make row draggable
      row.setAttr("draggable", "true");
      row.ondragstart = e => e.dataTransfer?.setData("text/plain", String(i));
      
      // Make row clickable to navigate to the file location
      row.onclick = async () => {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(m.file);
        this.app.workspace.getActiveViewOfType(MarkdownView)
          ?.editor.setCursor({line: m.line, ch: m.col});
      };
    });

    // Set up drop area interactions
    drop.ondragover = e => {
      e.preventDefault(); 
      drop.addClass("hover");
    };
    
    drop.ondragleave = () => drop.removeClass("hover");
    
    drop.ondrop = e => {
      e.preventDefault(); 
      drop.removeClass("hover");
      
      // Check if this is a manually selected text drop
      const selectedText = e.dataTransfer?.getData("application/x-selected-text");
      if (selectedText) {
        this.addManualSelection(selectedText, drop);
        return;
      }
      
      // Handle existing drag and drop from results list
      const i = parseInt(e.dataTransfer?.getData("text/plain") || "-1");
      if (i >= 0 && !this.selected.has(i)) {
        this.selected.add(i);
        const tag = drop.createEl("div", {cls: "pii-tag"});
        tag.textContent = currentResults[i].text;
        
        // Add a remove button to the tag
        const removeBtn = tag.createEl("span", {cls: "pii-tag-remove", text: "×"});
        removeBtn.style.marginLeft = "4px";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontWeight = "bold";
        
        removeBtn.onclick = (evt) => {
          evt.stopPropagation();
          this.selected.delete(i);
          tag.remove();
        };
      }
    };
  }

  /* -------- Add Manual Selection -------- */
  private addManualSelection(text: string, dropArea: HTMLElement) {
    // Generate a unique ID for this selection
    const id = makeUUID();
    
    // Add to manual selections
    this.manualSelections.push({text, id});
    
    // Create a tag in the drop area
    const tag = dropArea.createEl("div", {cls: "pii-tag pii-tag-manual"});
    tag.textContent = text;
    tag.setAttribute('data-manual-id', id);
    
    // Add a remove button to the tag
    const removeBtn = tag.createEl("span", {cls: "pii-tag-remove", text: "×"});
    removeBtn.style.marginLeft = "4px";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.fontWeight = "bold";
    
    removeBtn.onclick = (evt) => {
      evt.stopPropagation();
      // Remove from manual selections
      this.manualSelections = this.manualSelections.filter(s => s.id !== id);
      tag.remove();
    };
    
    new Notice(`Added "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" for encryption`);
  }

  /* -------- Encrypt Manual Selection -------- */
  private async encryptManualSelection(text: string, password: string): Promise<void> {
    // Get the currently active file
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      throw new Error("No active file to encrypt text in");
    }
    
    // Read the file content
    let fileContent = await this.app.vault.cachedRead(activeFile);
    
    // Find the first occurrence of the text
    const index = fileContent.indexOf(text);
    if (index === -1) {
      console.warn(`Text not found in active file: ${text.substring(0, 50)}`);
      return;
    }
    
    // Encrypt the text
    const cipher = await encrypt(text, password);
    const wrapped = `§ENC_${makeUUID().slice(0,6)}_${cipher}§`;
    
    // Replace the first occurrence of the text with encrypted version
    fileContent = fileContent.substring(0, index) + wrapped + fileContent.substring(index + text.length);
    
    // Save the modified file
    await this.app.vault.modify(activeFile, fileContent);
  }

  /* -------- Get Password (with caching) -------- */
  private async getPassword(isEncrypt: boolean = false): Promise<string | null> {
    // If we have a cached password, use it
    if (this.cachedPassword) {
      return this.cachedPassword;
    }
    
    // If we have a stored password and this is decryption, try to use the stored one
    if (!isEncrypt && this.plugin.settings.storedPassword) {
      // For now, we still need to prompt for the actual password since we only store hash
      // In a real implementation, you'd use proper key derivation
      const pwd = await new PwModal(this.app, "Enter Your Password", false).wait();
      if (pwd) {
        // Verify against stored hash
        const encoder = new TextEncoder();
        const data = encoder.encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (hashHex === this.plugin.settings.storedPassword) {
          this.cachedPassword = pwd;
          return pwd;
        } else {
          new Notice("Incorrect password");
          return null;
        }
      }
      return null;
    }
    
    // Show password modal
    const title = isEncrypt ? "Encrypt Sensitive Information" : "Decrypt Protected Information";
    const pwd = await new PwModal(this.app, title, isEncrypt).wait();
    
    if (pwd) {
      this.cachedPassword = pwd;
      
      // If this is encryption and no password is stored, offer to save it
      if (isEncrypt && !this.plugin.settings.storedPassword) {
        // Auto-save the password hash for future use
        const encoder = new TextEncoder();
        const data = encoder.encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        this.plugin.settings.storedPassword = hashHex;
        await this.plugin.saveSettings();
        new Notice("Password saved for future use");
      }
    }
    
    return pwd;
  }
  
  /* -------- Clear cached password -------- */
  private clearCachedPassword() {
    this.cachedPassword = null;
  }

  /* -------- Encrypt (Lock) -------- */
  private async lock(){
    // Get current results based on mode
    const currentResults = this.currentMode === 'scan' ? this.matches : this.searchResults;
    
    // If nothing explicitly selected, select all current results
    if(!this.selected.size){
      currentResults.forEach((_,i)=>this.selected.add(i));
    }
    
    // Check if we have anything to encrypt (either selections or manual selections)
    if(!this.selected.size && !this.manualSelections.length) {
      new Notice("No items selected for encryption");
      return;
    }
    
    // Get password (with caching/storage logic)
    const pwd = await this.getPassword(true);
    if(!pwd) return;

    // Calculate total items to encrypt
    const totalItems = this.selected.size + this.manualSelections.length;
    
    // Show progress indicator
    const statusBar = this.containerEl.createEl("div", {
      cls: "pii-status",
      text: `Encrypting ${totalItems} item(s)...`
    });
    
    try {
      let processedCount = 0;
      
      // Process each selected item from scan/search results
      for(const i of this.selected){
        const m = currentResults[i];
        const file = m.file;
        let text = await this.app.vault.cachedRead(file);

        // Encrypt the text
        const cipher = await encrypt(m.text, pwd);
        const wrapped = `§ENC_${makeUUID().slice(0,6)}_${cipher}§`;
        
        // Replace the original text with encrypted version
        text = text.replace(m.text, wrapped);
        await this.app.vault.modify(file, text);
        processedCount++;
      }
      
      // Process manual selections
      for (const selection of this.manualSelections) {
        await this.encryptManualSelection(selection.text, pwd);
        processedCount++;
      }
      
      // Show success message
      new Notice(`Successfully encrypted ${processedCount} item(s)`);
      
      // Clear the results and selections
      if (this.currentMode === 'scan') {
        this.matches = [];
      } else {
        this.searchResults = [];
      }
      this.selected.clear();
      this.manualSelections = [];
      this.render();
    } catch (error) {
      console.error("Encryption error:", error);
      new Notice("Error during encryption. Please try again.");
    } finally {
      // Remove the status bar
      if (statusBar && statusBar.parentNode) {
        statusBar.remove();
      }
    }
  }

  /* -------- Decrypt (Unlock) -------- */
  private async unlock(){
    // Get password (with caching/storage logic)
    const pwd = await this.getPassword(false);
    if(!pwd) return;

    // Pattern to match encrypted content
    const encRegex = /§ENC_[A-Za-z0-9]{6}_(.*?)§/g;

    // Show progress indicator
    const statusBar = this.containerEl.createEl("div", {
      cls: "pii-status",
      text: "Searching for encrypted content..."
    });

    try {
      let unlocked = 0;
      let filesProcessed = 0;
      const totalFiles = this.app.vault.getMarkdownFiles().length;
      
      // Process each markdown file
      for(const f of this.app.vault.getMarkdownFiles()){
        filesProcessed++;
        
        // Update progress indicator
        statusBar.textContent = `Processing files... (${filesProcessed}/${totalFiles})`;
        
        let txt = await this.app.vault.cachedRead(f);
        
        // Find all encrypted matches
        const matches: {full: string, cipher: string}[] = [];
        let match;
        while ((match = encRegex.exec(txt)) !== null) {
          matches.push({
            full: match[0],
            cipher: match[1]
          });
        }
        
        // If no matches, skip to next file
        if (matches.length === 0) continue;
        
        // Update status to show decryption in progress
        statusBar.textContent = `Decrypting content in ${f.basename}...`;
        
        // Decrypt all matches
        let changed = false;
        for (const m of matches) {
          try {
            // Await the decryption promise
            const plain = await decrypt(m.cipher, pwd);
            // Replace the encrypted text with the decrypted text
            txt = txt.replace(m.full, plain);
            unlocked++;
            changed = true;
          } catch (e) {
            // If decryption fails, it might be wrong password - clear cache
            console.error("Decryption failed:", e);
            if (this.cachedPassword) {
              this.clearCachedPassword();
              new Notice("Decryption failed. Password cache cleared.");
            }
          }
        }
        
        // Save changes if any decryption was successful
        if(changed) await this.app.vault.modify(f, txt);
      }
      
      // Show success or no matches found message
      if (unlocked > 0) {
        statusBar.textContent = `Successfully decrypted ${unlocked} item(s)`;
        statusBar.addClass("pii-status-success");
        new Notice(`Successfully decrypted ${unlocked} item(s)`);
      } else {
        statusBar.textContent = "No encrypted content found or incorrect password";
        new Notice("No encrypted content found or incorrect password");
        // Clear cached password if decryption failed
        this.clearCachedPassword();
      }
      
      // Keep status visible for a moment, then remove
      setTimeout(() => {
        if (statusBar && statusBar.parentNode) {
          statusBar.remove();
        }
      }, 3000);
      
    } catch (error) {
      console.error("Decryption error:", error);
      new Notice("Error during decryption. Please try again.");
      
      if (statusBar && statusBar.parentNode) {
        statusBar.remove();
      }
    }
  }
}
