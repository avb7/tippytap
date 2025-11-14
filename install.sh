#!/bin/bash

# Installation script for TippyTap extension
# For first-time installation

echo "📦 TippyTap - Installation"
echo ""

# Check if cursor CLI is available
if command -v cursor &> /dev/null; then
    echo "✅ Cursor CLI detected"
    echo ""
    echo "🔨 Building extension..."
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
    
    echo "📥 Installing in Cursor..."
    cursor --install-extension tippytap-0.0.1.vsix
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Extension installed successfully!"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Restart Cursor (close and reopen)"
        echo "   2. Open any .md file"
        echo "   3. Right-click → 'Open With...' → 'TippyTap'"
        exit 0
    fi
else
    echo "❌ Cursor CLI not found!"
    echo ""
    echo "🔧 To enable Cursor CLI:"
    echo "   1. Open Cursor"
    echo "   2. Press Cmd+Shift+P (or Ctrl+Shift+P)"
    echo "   3. Type: 'Shell Command: Install cursor command in PATH'"
    echo "   4. Click it and try running this script again"
    echo ""
    echo "OR install manually:"
    echo ""
    echo "   1. Run: npm run build && npm run package"
    echo "   2. In Cursor: Cmd+Shift+P → 'Extensions: Install from VSIX...'"
    echo "   3. Select: $(pwd)/tippytap-0.0.1.vsix"
    exit 1
fi

