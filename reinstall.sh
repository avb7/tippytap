#!/bin/bash

# Reinstall script for TippyTap extension
# This script rebuilds, packages, and reinstalls the extension in Cursor

echo "🔨 Building TippyTap extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📦 Packaging extension..."
npx @vscode/vsce package --no-dependencies

if [ $? -ne 0 ]; then
    echo "❌ Packaging failed!"
    exit 1
fi

echo ""
echo "✅ Package created: tippytap-0.0.1.vsix"
echo ""

# Check if cursor CLI is available
if command -v cursor &> /dev/null; then
    echo "🔄 Uninstalling old version from Cursor..."
    cursor --uninstall-extension tippytap 2>/dev/null || true
    
    echo "📥 Installing new version in Cursor..."
    cursor --install-extension tippytap-0.0.1.vsix
    
    if [ $? -eq 0 ]; then
        echo "✅ Extension installed successfully!"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Restart Cursor (close and reopen)"
        echo "   2. Open any .md file"
        echo "   3. Right-click → 'Open With...' → 'TippyTap'"
        exit 0
    fi
fi

# Fallback: Manual installation instructions
echo "📝 Manual installation:"
echo ""
echo "   In Cursor, press Cmd+Shift+P and type:"
echo "   'Extensions: Install from VSIX...'"
echo ""
echo "   Then select this file:"
echo "   $(pwd)/tippytap-0.0.1.vsix"
echo ""
echo "💡 To enable 'cursor' command line tool:"
echo "   1. Open Cursor"
echo "   2. Cmd+Shift+P → 'Shell Command: Install cursor command in PATH'"
echo ""

# Try to open in Finder for easy access
if command -v open &> /dev/null; then
    echo "📂 Opening package location in Finder..."
    open "$(pwd)"
fi

