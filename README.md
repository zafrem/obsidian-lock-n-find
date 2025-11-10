# Lock and Find Plugin

## Overview

Lock and Find is a plugin for [Obsidian](https://obsidian.md) that helps you quickly locate and lock content within your notes.

**Hint. You protect your data from others...**

This plugin is built with TypeScript and utilizes the Obsidian plugin API.

## Features

- **Dual Mode Operation**: Switch between automatic PII scanning and manual text search
- **Drag & Drop Interface**: Easily select sensitive information by dragging items to the encryption area
- **Text Selection Support**: Select text directly in your notes and drag it for encryption
- **Sidebar Integration**: Opens in the left sidebar for easy access while working
- **Secure Encryption**: Uses modern cryptographic standards to protect your sensitive data
- **Password Management**: Secure password storage with hashing for repeated use
- **Real-time Status**: Visual feedback during scanning and encryption operations
- **Customizable Settings**: Configure PII patterns and plugin behavior
- **Memory Efficient**: Optimized event handling prevents memory leaks

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "Lock and Find"
4. Install the plugin and enable it

### Manual Installation

1. Download the latest release from the GitHub releases page
2. Extract the files to your vault's plugin folder: `<vault>/.obsidian/plugins/obsidian-lock-n-find/`
3. Reload Obsidian
4. Enable the plugin in the Community Plugins settings

## Demo
![Demo](./demo/Demo.gif)

## Usage

### Basic Usage

1. Click the Lock and Find icon in the ribbon menu to open the sidebar
2. Choose between **Scan Mode** (automatic PII detection) or **Search Mode** (manual text search)
3. In Scan Mode: Click "Scan Vault" to automatically detect sensitive information
4. In Search Mode: Enter your search term and click "Search"
5. Drag and drop items to the encryption area or manually select text from your notes
6. Click "Lock Selected" to encrypt the sensitive information

### Modes

**Scan Mode**: Automatically detects potentially sensitive information using predefined patterns:
- Personal identification numbers
- Email addresses
- Phone numbers
- Credit card information
- Custom patterns you define

**Search Mode**: Manually search for specific text strings:
- Find all instances of specific words or phrases
- Case-sensitive or case-insensitive search
- Search across your entire vault

### Encryption & Decryption

**Encrypt (Lock)**: 
- Drag items from the results list to the drop area
- Select text in your notes and drag it to the drop area
- Click "Lock Selected" to encrypt all items
- Password is securely hashed and stored for convenience

**Decrypt (Unlock)**:
- Click "Unlock All" to decrypt all encrypted content in your vault
- Uses the same password from encryption
- Processes all markdown files automatically

## Configuration

The plugin can be configured through the settings tab:

1. Open Obsidian Settings
2. Navigate to Plugin Options
3. Select "Lock and Find"

Available settings include:

- **Case sensitivity**: Toggle case-sensitive searching
- **Highlight color**: Customize the color used for highlighting matches
- **Lock duration**: Set how long content remains locked
- **Search scope**: Configure which parts of your vault are searched

## Network Access Disclosure

This plugin includes **optional** features that may fetch resources from the internet. These features are **disabled by default** and only activate when explicitly configured by the user:

- **Import patterns from URL**: Allows downloading PII detection patterns from remote JSON files
- **Sync with GitHub Gist**: Enables synchronization of patterns with GitHub Gists
- **Auto-update patterns**: Periodically updates patterns from a configured URL

All network requests are made using Obsidian's built-in `requestUrl` API. The plugin does **not** transmit any of your vault content or personal data to external servers. Network features are only used to download pattern definitions to enhance PII detection capabilities.

## Troubleshooting

### Common Issues

- **Plugin doesn't appear in the ribbon**: Make sure the plugin is enabled in the Community Plugins settings
- **Search results are not accurate**: Check your search settings and try adjusting the case sensitivity option
- **Plugin conflicts with other search plugins**: Disable other search plugins temporarily to identify conflicts

### Error Reporting

If you encounter any bugs or issues:

1. Check the console for error messages (Ctrl+Shift+I)
2. Visit our [GitHub Issues page](https://github.com/zafrem/obsidian-lock-n-find/issues) to report the problem
3. Include details about your Obsidian version and operating system

## For Developers

### Development Setup

1. Clone this repository
2. Make sure your NodeJS is at least v16 (`node --version`)
3. Run `npm i` or `yarn` to install dependencies
4. Run `npm run dev` to start compilation in watch mode
5. Copy the output files to your Obsidian plugins folder or create a symbolic link

### Code Quality

This project follows modern development practices:

- **Memory Management**: Proper event listener cleanup to prevent memory leaks
- **Error Handling**: Consistent error logging and user feedback
- **Constants**: Named constants for timeouts and configuration values
- **TypeScript**: Full type safety throughout the codebase
- **ESLint**: Code quality enforcement (`eslint main.ts` or `eslint ./src/`)

## Release Process

For plugin maintainers, to release a new version:

1. Update `manifest.json` with the new version number and minimum Obsidian version
2. Update `versions.json` with `"new-plugin-version": "minimum-obsidian-version"`
3. Run `npm version [patch|minor|major]` to automatically update version numbers
4. Create a GitHub release with the exact version number (no 'v' prefix)
5. Upload `manifest.json`, `main.js`, and `styles.css` as binary attachments
6. Publish the release

> Note: The `manifest.json` file must be included both in the repository root and in the release.

## Resources

- [Obsidian Plugin API Documentation](https://github.com/obsidianmd/obsidian-api)
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Community Plugins](https://obsidian.md/plugins)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
