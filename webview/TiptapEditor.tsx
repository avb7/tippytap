import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { FileHandler } from '@tiptap/extension-file-handler';
import { markdownToDoc, docToMarkdown } from './markdownUtils';
import { Toolbar } from './Toolbar';
import { DiffView } from './DiffView';
import { MermaidExtension } from './extensions/MermaidExtension';
import { TableOfContentsView } from './TableOfContentsView';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

export const TiptapEditor: React.FC = () => {
    const [showRaw, setShowRaw] = useState(false);
    const [rawContent, setRawContent] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [pendingContent, setPendingContent] = useState<string>('');
    const [showToc, setShowToc] = useState(false);
    const lastContentRef = useRef<string>('');

    console.log('[Tiptap] Component rendering, isInitialized:', isInitialized);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'tiptap-table',
                },
            }),
            TableRow,
            TableCell,
            TableHeader,
            FileHandler.configure({
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
                onDrop: (currentEditor, files, pos) => {
                    files.forEach(file => {
                        const fileReader = new FileReader();
                        fileReader.readAsDataURL(file);
                        fileReader.onload = () => {
                            currentEditor.chain().insertContentAt(pos, {
                                type: 'image',
                                attrs: {
                                    src: fileReader.result,
                                },
                            }).focus().run();
                        };
                    });
                },
                onPaste: (currentEditor, files, htmlContent) => {
                    files.forEach(file => {
                        const fileReader = new FileReader();
                        fileReader.readAsDataURL(file);
                        fileReader.onload = () => {
                            currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
                                type: 'image',
                                attrs: {
                                    src: fileReader.result,
                                },
                            }).focus().run();
                        };
                    });
                },
            }),
            MermaidExtension,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
            },
        },
        onCreate: ({ editor }) => {
            console.log('[Tiptap] Editor created successfully');
        },
        onUpdate: ({ editor }) => {
            if (!isInitialized) {
                console.log('[Tiptap] Update ignored - not initialized yet');
                return;
            }
            
            // Don't sync if we're showing a diff
            if (showDiff) {
                console.log('[Tiptap] Update ignored - diff is showing');
                return;
            }
            
            // Convert editor content to markdown and send to VS Code
            const markdown = docToMarkdown(editor.state.doc);
            setRawContent(markdown);
            lastContentRef.current = markdown;
            
            // Debounce updates to avoid excessive syncing
            clearTimeout((window as any).__updateTimeout);
            (window as any).__updateTimeout = setTimeout(() => {
                console.log('[Tiptap] Sending update to VS Code, content length:', markdown.length);
                vscode.postMessage({
                    type: 'update',
                    content: markdown,
                });
            }, 300);
        },
    });

    // Handle messages from VS Code
    useEffect(() => {
        const messageListener = (event: MessageEvent) => {
            const message = event.data;
            
            console.log('[Tiptap] Received message:', message.type);
            
            switch (message.type) {
                case 'init':
                    console.log('[Tiptap] Initializing with content length:', message.content?.length);
                    if (editor) {
                        try {
                            const content = markdownToDoc(message.content);
                            console.log('[Tiptap] Setting content:', content.substring(0, 100));
                            editor.commands.setContent(content);
                            setRawContent(message.content);
                            lastContentRef.current = message.content;
                            setIsInitialized(true);
                            console.log('[Tiptap] Editor initialized successfully');
                        } catch (error) {
                            console.error('[Tiptap] Error setting content:', error);
                            editor.commands.setContent(`<p>${message.content}</p>`);
                            setRawContent(message.content);
                            lastContentRef.current = message.content;
                            setIsInitialized(true);
                        }
                    } else {
                        console.error('[Tiptap] Editor not ready yet');
                    }
                    break;
                case 'externalChange':
                    // External change detected (e.g., from Cursor AI)
                    console.log('[Tiptap] External change detected, showing diff');
                    setPendingContent(message.content);
                    setShowDiff(true);
                    break;
                case 'toggleRawView':
                    setShowRaw(prev => !prev);
                    break;
            }
        };

        window.addEventListener('message', messageListener);
        
        return () => {
            window.removeEventListener('message', messageListener);
        };
    }, [editor]);

    // Signal ready when editor is initialized
    useEffect(() => {
        if (editor) {
            console.log('[Tiptap] Editor ready, signaling to VS Code');
            vscode.postMessage({ type: 'ready' });
        }
    }, [editor]);

    const handleRawContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setRawContent(newContent);
        
        if (editor) {
            try {
                const content = markdownToDoc(newContent);
                editor.commands.setContent(content);
                vscode.postMessage({
                    type: 'update',
                    content: newContent,
                });
            } catch (error) {
                console.error('[Tiptap] Error updating from raw content:', error);
            }
        }
    }, [editor]);

    if (!editor) {
        return <div className="loading">Loading editor...</div>;
    }

    if (showRaw) {
        return (
            <div className="raw-editor-container">
                <div className="toolbar">
                    <button onClick={() => setShowRaw(false)} className="toolbar-button">
                        ← Back to Editor
                    </button>
                </div>
                <textarea
                    className="raw-editor"
                    value={rawContent}
                    onChange={handleRawContentChange}
                    spellCheck={false}
                />
            </div>
        );
    }

    const handleAcceptDiff = useCallback(() => {
        if (editor && pendingContent) {
            console.log('[Tiptap] Accepting external changes');
            const content = markdownToDoc(pendingContent);
            editor.commands.setContent(content);
            setRawContent(pendingContent);
            lastContentRef.current = pendingContent;
            setShowDiff(false);
            setPendingContent('');
            
            // Send accepted changes to VS Code
            vscode.postMessage({
                type: 'update',
                content: pendingContent,
            });
        }
    }, [editor, pendingContent]);

    const handleRejectDiff = useCallback(() => {
        console.log('[Tiptap] Rejecting external changes');
        setShowDiff(false);
        setPendingContent('');
        
        // Keep current content, notify VS Code to revert
        vscode.postMessage({
            type: 'rejectChanges',
            content: lastContentRef.current,
        });
    }, []);

    // Show diff view when external changes detected
    if (showDiff && pendingContent) {
        return (
            <div className="editor-container">
                <Toolbar editor={editor} />
                <DiffView
                    oldContent={lastContentRef.current}
                    newContent={pendingContent}
                    onAccept={handleAcceptDiff}
                    onReject={handleRejectDiff}
                />
            </div>
        );
    }

    return (
        <div className="editor-container">
            <Toolbar editor={editor} onToggleToc={() => setShowToc(!showToc)} />
            <div className="editor-content-wrapper">
                <EditorContent editor={editor} />
                {showToc && <TableOfContentsView editor={editor} onClose={() => setShowToc(false)} />}
            </div>
        </div>
    );
};

