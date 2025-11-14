import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MermaidNodeView } from './MermaidNodeView';

export interface MermaidOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        mermaid: {
            setMermaid: (content: string) => ReturnType;
        };
    }
}

export const MermaidExtension = Node.create<MermaidOptions>({
    name: 'mermaid',
    group: 'block',
    atom: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            content: {
                default: '',
                parseHTML: element => element.getAttribute('data-mermaid-content'),
                renderHTML: attributes => {
                    return {
                        'data-mermaid-content': attributes.content,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-mermaid-content]',
                getAttrs: (node) => {
                    const element = node as HTMLElement;
                    return {
                        content: element.getAttribute('data-mermaid-content') || '',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: 'mermaid-wrapper',
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MermaidNodeView);
    },

    addCommands() {
        return {
            setMermaid: (content: string) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { content },
                });
            },
        };
    },
});

