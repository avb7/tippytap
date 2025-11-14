import * as vscode from 'vscode';
import { TiptapEditorProvider } from './editor/TiptapEditorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('TippyTap is now active');

    // Register the custom editor provider
    const provider = new TiptapEditorProvider(context);
    const registration = vscode.window.registerCustomEditorProvider(
        TiptapEditorProvider.viewType,
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }
    );

    context.subscriptions.push(registration);

    // Register the toggle raw view command
    const toggleRawViewCommand = vscode.commands.registerCommand(
        'tippytap.toggleRawView',
        () => {
            // Send message to active webview
            if (provider.activeEditor) {
                provider.activeEditor.webviewPanel.webview.postMessage({
                    type: 'toggleRawView',
                });
            }
        }
    );

    // Register the "Open with TippyTap" command
    const openWithTippyTapCommand = vscode.commands.registerCommand(
        'tippytap.openWithTippyTap',
        async (uri: vscode.Uri) => {
            // Open the file with our custom editor
            await vscode.commands.executeCommand('vscode.openWith', uri, TiptapEditorProvider.viewType);
        }
    );

    context.subscriptions.push(toggleRawViewCommand);
    context.subscriptions.push(openWithTippyTapCommand);
}

export function deactivate() {}

