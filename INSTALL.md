# Installation Guide

## Quick Install (Recommended)

### Method 1: Using the script
```bash
cd /Users/aditya/Workspace/tippytap
npm run reinstall
```

This will build, package, and open the folder. Then follow the manual steps below.

### Method 2: Manual Install in Cursor

1. **Open Cursor**
2. Press **`Cmd + Shift + P`** (Mac) or **`Ctrl + Shift + P`** (Windows/Linux)
3. Type: **`Extensions: Install from VSIX...`**
4. Navigate to and select:
   ```
   /Users/aditya/Workspace/tippytap/tiptap-markdown-editor-0.0.1.vsix
   ```
5. **Restart Cursor**
6. Open any `.md` file
7. **Right-click** → **"Open With..."** → **"Tiptap Markdown Editor"**

## Enable Cursor CLI (Optional)

To use `cursor` command from terminal:

1. Open Cursor
2. Press `Cmd + Shift + P`
3. Type: **"Shell Command: Install cursor command in PATH"**
4. Click it

After this, you can use:
```bash
cursor --install-extension tiptap-markdown-editor-0.0.1.vsix
```

## Development Mode

For testing during development:

1. Open this project in Cursor
2. Press **F5** (or Run → Start Debugging)
3. A new "Extension Development Host" window opens
4. Open any `.md` file there
5. Right-click → "Open With..." → "Tiptap Markdown Editor"

Changes you make will be reflected after reloading the window.

## Useful Commands

```bash
# Rebuild only
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Package only
npm run package

# Full reinstall
npm run reinstall
```

## Troubleshooting

### Extension not showing in "Open With..."
- Make sure you restarted Cursor after installation
- Check Extensions view to confirm it's installed
- Look for "Tiptap Markdown Editor" in the list

### Content not loading
- Open Developer Console: `Cmd + Shift + P` → "Developer: Toggle Developer Tools"
- Check for errors in Console tab
- Also check: `Cmd + Shift + P` → "Developer: Open Webview Developer Tools"

### Need to uninstall
```bash
# Via Cursor
Extensions view → Tiptap Markdown Editor → Uninstall

# Via CLI (if enabled)
cursor --uninstall-extension tiptap-markdown-editor
```

## Making it Default Editor

To always open `.md` files with Tiptap:

1. Right-click any `.md` file
2. "Open With..." → "Tiptap Markdown Editor"  
3. Click **"Configure default editor for '*.md'..."**
4. Select "Tiptap Markdown Editor"

