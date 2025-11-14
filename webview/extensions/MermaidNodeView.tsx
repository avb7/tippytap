import React, { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    fontFamily: 'var(--vscode-font-family)',
});

export const MermaidNodeView = ({ node, updateAttributes, deleteNode, editor }: any) => {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string>('');
    // In read-only mode (like diff view), always show code by default
    const [showCode, setShowCode] = useState<boolean>(!editor.isEditable);
    const [editingCode, setEditingCode] = useState<string>(node.attrs.content || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const mermaidContent = node.attrs.content;
    const isReadOnly = !editor.isEditable;

    useEffect(() => {
        if (!mermaidContent || showCode) {
            return;
        }

        const renderDiagram = async () => {
            try {
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const { svg: renderedSvg } = await mermaid.render(id, mermaidContent);
                setSvg(renderedSvg);
                setError('');
            } catch (err: any) {
                console.error('[Mermaid] Render error:', err);
                setError(err.message || 'Failed to render diagram');
                setSvg('');
            }
        };

        renderDiagram();
    }, [mermaidContent, showCode]);

    useEffect(() => {
        setEditingCode(node.attrs.content || '');
    }, [node.attrs.content]);

    const handleToggleView = () => {
        setShowCode(!showCode);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditingCode(e.target.value);
    };

    const handleSaveCode = () => {
        updateAttributes({ content: editingCode });
        setShowCode(false);
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingCode(node.attrs.content || '');
        setShowCode(false);
    };

    // Code editing view
    if (showCode) {
        // Read-only code view (for diff view)
        if (isReadOnly) {
            return (
                <NodeViewWrapper className="mermaid-node-view">
                    <div className="mermaid-code-readonly">
                        <div className="mermaid-code-header">
                            <span className="mermaid-code-label">Mermaid Diagram</span>
                        </div>
                        <pre className="mermaid-code-content">{mermaidContent}</pre>
                    </div>
                </NodeViewWrapper>
            );
        }
        
        // Editable code view
        return (
            <NodeViewWrapper className="mermaid-node-view">
                <div className="mermaid-editor">
                    <div className="mermaid-editor-header">
                        <span className="mermaid-editor-title">Edit Mermaid Diagram</span>
                        <div className="mermaid-editor-actions">
                            <button 
                                className="mermaid-button secondary" 
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                            <button 
                                className="mermaid-button primary" 
                                onClick={handleSaveCode}
                            >
                                Save & Preview
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="mermaid-code-editor"
                        value={editingCode}
                        onChange={handleCodeChange}
                        spellCheck={false}
                        placeholder="Enter mermaid diagram code..."
                    />
                </div>
            </NodeViewWrapper>
        );
    }

    // Error view
    if (error) {
        return (
            <NodeViewWrapper className="mermaid-node-view">
                <div className="mermaid-error">
                    <div className="mermaid-error-header">
                        <strong>Mermaid Diagram Error</strong>
                        <button 
                            className="mermaid-button-small" 
                            onClick={handleToggleView}
                        >
                            View Code
                        </button>
                    </div>
                    <pre>{error}</pre>
                </div>
            </NodeViewWrapper>
        );
    }

    // Loading view
    if (!svg) {
        return (
            <NodeViewWrapper className="mermaid-node-view">
                <div className="mermaid-loading">Loading diagram...</div>
            </NodeViewWrapper>
        );
    }

    // Preview view
    return (
        <NodeViewWrapper className="mermaid-node-view">
            <div className="mermaid-preview-container">
                <button 
                    className="mermaid-toggle-button" 
                    onClick={handleToggleView}
                    title="View Code"
                >
                    {'</>'}
                </button>
                <div 
                    ref={containerRef}
                    className="mermaid-diagram" 
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </div>
        </NodeViewWrapper>
    );
};

