import * as vscode from 'vscode';
import * as path from 'path';

export class TiptapEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'tippytap.editor';
    public activeEditor: { webviewPanel: vscode.WebviewPanel } | undefined;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        console.log('[Extension] resolveCustomTextEditor called for:', document.uri.toString());
        
        // Set up webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        console.log('[Extension] Generating HTML for webview');
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        console.log('[Extension] HTML set, waiting for webview to load');

        // Track active editor
        this.activeEditor = { webviewPanel };
        webviewPanel.onDidDispose(() => {
            if (this.activeEditor?.webviewPanel === webviewPanel) {
                this.activeEditor = undefined;
            }
        });

        // Send initial document content to webview
        function updateWebview() {
            const content = document.getText();
            console.log('[Extension] Sending init message with content length:', content.length);
            console.log('[Extension] Content preview:', content.substring(0, 100));
            webviewPanel.webview.postMessage({
                type: 'init',
                content: content,
            });
        }

        // Track if we're currently updating to prevent sync loops
        let isUpdatingFromWebview = false;
        let lastContentFromWebview = '';

        // Handle changes from webview
        const changeDocumentSubscription = webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                console.log('[Extension] Received message from webview:', message.type);
                switch (message.type) {
                    case 'update':
                        console.log('[Extension] Updating document, content length:', message.content?.length);
                        isUpdatingFromWebview = true;
                        lastContentFromWebview = message.content;
                        await this.updateTextDocument(document, message.content);
                        // Keep the flag active for a short time to catch the change event
                        setTimeout(() => {
                            isUpdatingFromWebview = false;
                        }, 100);
                        break;
                    case 'ready':
                        console.log('[Extension] Webview ready, sending initial content');
                        updateWebview();
                        break;
                    case 'rejectChanges':
                        console.log('[Extension] Changes rejected, reverting document');
                        isUpdatingFromWebview = true;
                        lastContentFromWebview = message.content;
                        await this.updateTextDocument(document, message.content);
                        setTimeout(() => {
                            isUpdatingFromWebview = false;
                        }, 100);
                        break;
                }
            }
        );

        // Handle changes to the document from other sources (not from webview)
        const changeTextDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString()) {
                const currentContent = document.getText();
                
                // Only show diff if:
                // 1. Not currently updating from webview
                // 2. Content is different from what we last sent from webview
                if (!isUpdatingFromWebview && currentContent !== lastContentFromWebview) {
                    console.log('[Extension] External document change detected (possibly from AI), showing diff');
                    webviewPanel.webview.postMessage({
                        type: 'externalChange',
                        content: currentContent,
                    });
                    // Don't update lastContentFromWebview here - only webview should update it
                } else {
                    console.log('[Extension] Ignoring document change from webview (preventing loop)', {
                        isUpdatingFromWebview,
                        contentMatch: currentContent === lastContentFromWebview
                    });
                }
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            changeTextDocumentSubscription.dispose();
        });

        updateWebview();
    }

    private async updateTextDocument(document: vscode.TextDocument, content: string) {
        const edit = new vscode.WorkspaceEdit();
        
        // Replace entire document
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );

        await vscode.workspace.applyEdit(edit);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview.js'))
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>TippyTap Editor</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: var(--vscode-foreground);
        }

        .editor-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        .editor-content-wrapper {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .tiptap-editor {
            outline: none;
            min-height: 100%;
        }

        .tiptap-editor h1 {
            font-size: 2em;
            font-weight: bold;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
            line-height: 1.3;
        }

        .tiptap-editor h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
            line-height: 1.3;
        }

        .tiptap-editor h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 1em;
            line-height: 1.3;
        }

        .tiptap-editor h4 {
            font-size: 1em;
            font-weight: bold;
            margin-top: 1.33em;
            margin-bottom: 1.33em;
            line-height: 1.3;
        }

        .tiptap-editor h5 {
            font-size: 0.83em;
            font-weight: bold;
            margin-top: 1.67em;
            margin-bottom: 1.67em;
            line-height: 1.3;
        }

        .tiptap-editor h6 {
            font-size: 0.67em;
            font-weight: bold;
            margin-top: 2.33em;
            margin-bottom: 2.33em;
            line-height: 1.3;
        }

        .tiptap-editor p {
            margin: 1em 0;
            line-height: 1.6;
        }

        .tiptap-editor ul,
        .tiptap-editor ol {
            padding-left: 2em;
            margin: 1em 0;
        }

        .tiptap-editor li {
            margin: 0.5em 0;
        }

        .tiptap-editor code {
            background-color: var(--vscode-textCodeBlock-background);
            border-radius: 3px;
            padding: 0.2em 0.4em;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
        }

        .tiptap-editor pre {
            background-color: var(--vscode-textCodeBlock-background);
            border-radius: 5px;
            padding: 1em;
            overflow-x: auto;
            margin: 1em 0;
        }

        .tiptap-editor pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
            font-size: 0.9em;
        }

        .tiptap-editor blockquote {
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            background-color: var(--vscode-textBlockQuote-background);
            padding: 0.5em 1em;
            margin: 1em 0;
        }

        .tiptap-editor hr {
            border: none;
            border-top: 1px solid var(--vscode-panel-border);
            margin: 2em 0;
        }

        .tiptap-editor strong {
            font-weight: bold;
        }

        .tiptap-editor em {
            font-style: italic;
        }

        .tiptap-editor a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        .tiptap-editor a:hover {
            text-decoration: underline;
        }

        .raw-editor-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        /* Toolbar Styles */
        .toolbar {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            gap: 4px;
            flex-wrap: wrap;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .toolbar-group {
            display: flex;
            gap: 2px;
        }

        .toolbar-separator {
            width: 1px;
            height: 24px;
            background-color: var(--vscode-panel-border);
            margin: 0 4px;
        }

        .toolbar-button {
            background-color: transparent;
            color: var(--vscode-foreground);
            border: 1px solid transparent;
            padding: 6px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
            height: 28px;
            transition: all 0.15s ease;
        }

        .toolbar-button:hover:not(:disabled) {
            background-color: var(--vscode-toolbar-hoverBackground);
            border-color: var(--vscode-contrastBorder);
        }

        .toolbar-button:active:not(:disabled) {
            background-color: var(--vscode-toolbar-activeBackground);
        }

        .toolbar-button.is-active {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-color: var(--vscode-button-border);
        }

        .toolbar-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        /* Diff View Styles */
        .diff-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 64px);
            overflow: hidden;
        }

        .diff-header {
            padding: 16px 20px;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .diff-title {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .diff-subtitle {
            font-size: 12px;
            opacity: 0.7;
        }

        .diff-actions {
            display: flex;
            gap: 12px;
        }

        .diff-button {
            padding: 8px 20px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }

        .diff-button.accept {
            background-color: rgb(0, 180, 0);
            color: white;
        }

        .diff-button.accept:hover {
            background-color: rgb(0, 200, 0);
        }

        .diff-button.reject {
            background-color: rgb(200, 0, 0);
            color: white;
        }

        .diff-button.reject:hover {
            background-color: rgb(220, 0, 0);
        }

        .diff-editor-wrapper {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .diff-tiptap-editor .tiptap-editor {
            outline: none;
        }

        /* Diff highlights in Tiptap editor */
        .diff-highlight-added,
        span[data-diff-added="true"] {
            background-color: rgba(0, 255, 0, 0.3);
            border-radius: 2px;
            padding: 2px 0;
        }

        .diff-highlight-removed,
        span[data-diff-removed="true"] {
            background-color: rgba(255, 0, 0, 0.3);
            text-decoration: line-through;
            border-radius: 2px;
            padding: 2px 0;
        }

        .raw-editor {
            flex: 1;
            width: 100%;
            padding: 20px;
            border: none;
            outline: none;
            resize: none;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.6;
        }

        /* Mermaid Diagram Styles */
        .mermaid-node-view {
            margin: 1.5em 0;
        }

        .mermaid-preview-container {
            position: relative;
        }

        .mermaid-toggle-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 12px;
            z-index: 10;
            opacity: 0.7;
            transition: opacity 0.2s;
        }

        .mermaid-toggle-button:hover {
            opacity: 1;
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .mermaid-diagram {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1.5em;
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            overflow-x: auto;
        }

        .mermaid-diagram svg {
            max-width: 100%;
            height: auto;
        }

        .mermaid-code-readonly {
            border: 1px solid var(--vscode-editorWidget-border);
            border-radius: 4px;
            margin: 8px 0;
            background: var(--vscode-editor-background);
        }

        .mermaid-code-header {
            padding: 8px 12px;
            background: var(--vscode-editorWidget-background);
            border-bottom: 1px solid var(--vscode-editorWidget-border);
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .mermaid-code-label {
            color: var(--vscode-textLink-foreground);
        }

        .mermaid-code-content {
            padding: 12px;
            margin: 0;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: var(--vscode-editor-foreground);
            background: var(--vscode-editor-background);
        }

        .mermaid-loading {
            text-align: center;
            padding: 2em;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        /* Mermaid Code Editor */
        .mermaid-editor {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            overflow: hidden;
            margin: 1em 0;
        }

        .mermaid-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .mermaid-editor-title {
            font-weight: 500;
            font-size: 13px;
        }

        .mermaid-editor-actions {
            display: flex;
            gap: 8px;
        }

        .mermaid-button {
            padding: 6px 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
        }

        .mermaid-button.primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .mermaid-button.primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .mermaid-button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .mermaid-button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .mermaid-code-editor {
            width: 100%;
            min-height: 200px;
            padding: 12px;
            border: none;
            outline: none;
            resize: vertical;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.5;
        }

        /* Mermaid Error Styles */
        .mermaid-error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 6px;
            padding: 1em;
            margin: 1em 0;
        }

        .mermaid-error-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5em;
        }

        .mermaid-error strong {
            color: var(--vscode-errorForeground);
        }

        .mermaid-error pre {
            margin-top: 0.5em;
            font-size: 0.9em;
            background: transparent;
            padding: 0;
        }

        .mermaid-button-small {
            padding: 4px 8px;
            border-radius: 3px;
            border: none;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 11px;
        }

        .mermaid-button-small:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        /* Table Styles */
        .tiptap-table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            margin: 1em 0;
            overflow: hidden;
        }

        .tiptap-table td,
        .tiptap-table th {
            min-width: 1em;
            border: 1px solid var(--vscode-panel-border);
            padding: 8px 12px;
            vertical-align: top;
            box-sizing: border-box;
            position: relative;
        }

        .tiptap-table th {
            font-weight: bold;
            text-align: left;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
        }

        .tiptap-table .selectedCell {
            background-color: var(--vscode-list-inactiveSelectionBackground);
        }

        .tiptap-table p {
            margin: 0;
        }

        /* Table of Contents Sidebar */
        .toc-sidebar {
            position: fixed;
            right: 0;
            top: 52px;
            width: 280px;
            height: calc(100vh - 52px);
            background-color: var(--vscode-sideBar-background);
            border-left: 1px solid var(--vscode-panel-border);
            display: flex;
            flex-direction: column;
            z-index: 100;
        }

        .toc-header {
            padding: 10px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-sideBarSectionHeader-background);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .toc-close-button {
            background: transparent;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 16px;
        }

        .toc-close-button:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }

        .toc-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .toc-empty {
            padding: 20px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .toc-item {
            padding: 8px 12px;
            margin: 2px 0;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.15s;
        }

        .toc-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .toc-text {
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-height: 1.4;
        }
        
        #root {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

