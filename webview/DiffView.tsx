import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Mark, mergeAttributes } from '@tiptap/core';
import { diffWords, Change } from 'diff';
import { markdownToDoc } from './markdownUtils';
import { MermaidExtension } from './extensions/MermaidExtension';

// Custom marks for diff highlighting
const DiffAdded = Mark.create({
    name: 'diffAdded',
    parseHTML() {
        return [{ tag: 'span[data-diff-added]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 
            'data-diff-added': 'true',
            class: 'diff-highlight-added' 
        }), 0];
    },
});

const DiffRemoved = Mark.create({
    name: 'diffRemoved',
    parseHTML() {
        return [{ tag: 'span[data-diff-removed]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 
            'data-diff-removed': 'true',
            class: 'diff-highlight-removed' 
        }), 0];
    },
});

interface DiffViewProps {
    oldContent: string;
    newContent: string;
    onAccept: () => void;
    onReject: () => void;
}

export const DiffView: React.FC<DiffViewProps> = ({ oldContent, newContent, onAccept, onReject }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
                resizable: false,
            }),
            TableRow,
            TableCell,
            TableHeader,
            MermaidExtension,
            DiffAdded,
            DiffRemoved,
        ],
        editable: false,
        content: '',
    });

    useEffect(() => {
        if (!editor) return;

        // Get word-level differences
        const changes = diffWords(oldContent, newContent);
        
        // Build marked-up markdown
        let markedContent = '';
        changes.forEach((change: Change) => {
            const text = change.value;
            if (change.added) {
                // Wrap added text with special markers
                markedContent += `<span data-diff-added="true">${escapeHtml(text)}</span>`;
            } else if (change.removed) {
                // Wrap removed text with special markers
                markedContent += `<span data-diff-removed="true">${escapeHtml(text)}</span>`;
            } else {
                markedContent += escapeHtml(text);
            }
        });

        // Convert the marked content to HTML
        const html = markdownToDoc(markedContent);
        
        // Set content in editor
        editor.commands.setContent(html);
    }, [editor, oldContent, newContent]);

    if (!editor) {
        return <div className="loading">Loading diff...</div>;
    }

    return (
        <div className="diff-container">
            <div className="diff-header">
                <div className="diff-title">
                    <strong>Changes Detected</strong>
                    <span className="diff-subtitle">Review changes made to this file</span>
                </div>
                <div className="diff-actions">
                    <button className="diff-button reject" onClick={onReject}>
                        ✗ Reject
                    </button>
                    <button className="diff-button accept" onClick={onAccept}>
                        ✓ Accept
                    </button>
                </div>
            </div>
            <div className="diff-editor-wrapper">
                <EditorContent editor={editor} className="diff-tiptap-editor" />
            </div>
        </div>
    );
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

