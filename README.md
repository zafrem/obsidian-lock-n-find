# Lock and Find Plugin

## Overview

Lock and Find is a plugin for [Obsidian](https://obsidian.md) that helps you quickly locate and lock content within your notes. 
**Hint. We protect your data from company.**

This plugin is built with TypeScript and utilizes the Obsidian plugin API.

## Features

- Adds a ribbon icon for quick access to the plugin functionality
- Provides commands to find and lock content in your notes
- Includes customizable settings in the plugin settings tab
- Supports global event handling for improved user experience

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

## Usage

### Basic Usage

1. Click the Lock and Find icon in the ribbon menu
2. Enter your search term in the search field
3. Use the provided options to refine your search
4. Click on results to navigate to them

### Commands

The plugin provides several commands that can be accessed via the Command Palette (Ctrl/Cmd+P):

- **Open Lock and Find**: Opens the main search interface
- **Lock Current Selection**: Locks the currently selected text
- **Find in Current Note**: Searches only within the active note

### Settings

Customize the plugin behavior in the Settings tab:

- Configure search behavior and appearance
- Set keyboard shortcuts for common actions
- Adjust highlighting and locking preferences

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

## Troubleshooting

### Common Issues

- **Plugin doesn't appear in the ribbon**: Make sure the plugin is enabled in the Community Plugins settings
- **Search results are not accurate**: Check your search settings and try adjusting the case sensitivity option
- **Plugin conflicts with other search plugins**: Disable other search plugins temporarily to identify conflicts

### Error Reporting

If you encounter any bugs or issues:

1. Check the console for error messages (Ctrl+Shift+I)
2. Visit our [GitHub Issues page](https://github.com/yourusername/obsidian-lock-n-find/issues) to report the problem
3. Include details about your Obsidian version and operating system

## For Developers

### Development Setup

1. Clone this repository
2. Make sure your NodeJS is at least v16 (`node --version`)
3. Run `npm i` or `yarn` to install dependencies
4. Run `npm run dev` to start compilation in watch mode
5. Copy the output files to your Obsidian plugins folder or create a symbolic link

### Code Quality

This project uses ESLint to maintain code quality:

- Install ESLint: `npm install -g eslint`
- Run analysis: `eslint main.ts` or `eslint ./src/`

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
