import React from 'react';
import { Editor } from '@tiptap/react';

interface ToolbarProps {
    editor: Editor;
    onToggleToc?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor, onToggleToc }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="toolbar">
            {onToggleToc && (
                <>
                    <div className="toolbar-group">
                        <button
                            onClick={onToggleToc}
                            className="toolbar-button"
                            title="Toggle Table of Contents"
                        >
                            ☰
                        </button>
                    </div>
                    <div className="toolbar-separator" />
                </>
            )}
            
            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="toolbar-button"
                    title="Undo (Cmd+Z)"
                >
                    ↶
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="toolbar-button"
                    title="Redo (Cmd+Shift+Z)"
                >
                    ↷
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Bold (Cmd+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Italic (Cmd+I)"
                >
                    <em>I</em>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Strikethrough"
                >
                    <s>S</s>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Inline Code"
                >
                    {'<>'}
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Heading 3"
                >
                    H3
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Bullet List"
                >
                    • List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Numbered List"
                >
                    1. List
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Code Block"
                >
                    {'{ }'}
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Blockquote"
                >
                    ❝❞
                </button>
                <button
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    className="toolbar-button"
                    title="Horizontal Rule"
                >
                    ―
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="toolbar-button"
                    title="Insert Table"
                >
                    ⊞
                </button>
                <button
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    disabled={!editor.can().addColumnAfter()}
                    className="toolbar-button"
                    title="Add Column"
                >
                    ⫴
                </button>
                <button
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    disabled={!editor.can().addRowAfter()}
                    className="toolbar-button"
                    title="Add Row"
                >
                    ⫵
                </button>
                <button
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    disabled={!editor.can().deleteTable()}
                    className="toolbar-button"
                    title="Delete Table"
                >
                    ⊠
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={editor.isActive('paragraph') ? 'toolbar-button is-active' : 'toolbar-button'}
                    title="Paragraph"
                >
                    ¶
                </button>
                <button
                    onClick={() => editor.chain().focus().setHardBreak().run()}
                    className="toolbar-button"
                    title="Hard Break"
                >
                    ↵
                </button>
                <button
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                    className="toolbar-button"
                    title="Clear Formatting"
                >
                    ✗
                </button>
            </div>
        </div>
    );
};

