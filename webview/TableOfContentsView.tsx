import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

interface Heading {
    level: number;
    text: string;
    id: string;
}

interface TableOfContentsViewProps {
    editor: Editor;
    onClose: () => void;
}

export const TableOfContentsView: React.FC<TableOfContentsViewProps> = ({ editor, onClose }) => {
    const [headings, setHeadings] = useState<Heading[]>([]);

    useEffect(() => {
        const updateHeadings = () => {
            const items: Heading[] = [];
            const { doc } = editor.state;

            doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    items.push({
                        level: node.attrs.level,
                        text: node.textContent,
                        id: `heading-${pos}`,
                    });
                }
            });

            setHeadings(items);
        };

        updateHeadings();
        editor.on('update', updateHeadings);

        return () => {
            editor.off('update', updateHeadings);
        };
    }, [editor]);

    const scrollToHeading = (text: string) => {
        const { doc } = editor.state;
        let targetPos: number | null = null;

        doc.descendants((node, pos) => {
            if (node.type.name === 'heading' && node.textContent === text) {
                targetPos = pos;
                return false;
            }
        });

        if (targetPos !== null) {
            // Set selection at the heading
            editor.commands.setTextSelection(targetPos);
            editor.commands.focus();
            
            // Scroll using coordsAtPos for more accurate positioning
            setTimeout(() => {
                const { view } = editor;
                try {
                    // Get the coordinates of the position
                    const coords = view.coordsAtPos(targetPos!);
                    
                    // Get the editor's DOM element
                    const editorElement = view.dom;
                    const scrollContainer = editorElement.parentElement;
                    
                    if (scrollContainer) {
                        // Calculate the scroll position
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const scrollTop = coords.top - containerRect.top + scrollContainer.scrollTop - 20;
                        
                        // Smooth scroll to the position
                        scrollContainer.scrollTo({
                            top: scrollTop,
                            behavior: 'smooth'
                        });
                    }
                } catch (error) {
                    console.error('[TOC] Error scrolling to heading:', error);
                    // Fallback: try to find the DOM node and scroll to it
                    const domNode = view.domAtPos(targetPos!);
                    if (domNode && domNode.node) {
                        const element = domNode.node instanceof Element ? domNode.node : domNode.node.parentElement;
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }, 50);
        }
    };

    return (
        <div className="toc-sidebar">
            <div className="toc-header">
                <strong>Table of Contents</strong>
                <button className="toc-close-button" onClick={onClose}>
                    ✕
                </button>
            </div>
            <div className="toc-list">
                {headings.length === 0 ? (
                    <div className="toc-empty">No headings found</div>
                ) : (
                    headings.map((heading, index) => (
                        <div
                            key={`${heading.id}-${index}`}
                            className="toc-item"
                            style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
                            onClick={() => scrollToHeading(heading.text)}
                        >
                            <span className="toc-text">{heading.text}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};



