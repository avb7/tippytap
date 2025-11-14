import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { MarkdownSerializer } from 'prosemirror-markdown';
import { md } from './markdownToHtmlWithMermaid';

/**
 * Convert markdown text to HTML string that Tiptap can parse
 */
export function markdownToDoc(markdown: string): string {
    try {
        if (!markdown || markdown.trim() === '') {
            return '<p></p>';
        }
        
        // Normalize line endings
        const normalizedMarkdown = markdown.replace(/\r\n/g, '\n');
        
        // Convert markdown to HTML using markdown-it (with mermaid support)
        const html = md.render(normalizedMarkdown);
        console.log('[markdownUtils] Converted markdown to HTML');
        console.log('[markdownUtils] Input length:', markdown.length, 'Output length:', html.length);
        
        return html;
    } catch (error) {
        console.error('[markdownUtils] Error parsing markdown:', error);
        // Fallback to wrapping in paragraph
        return `<p>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
}

/**
 * Convert ProseMirror document to markdown text
 */
export function docToMarkdown(doc: ProseMirrorNode): string {
    try {
        // Create a custom serializer that works with Tiptap's node names
        const serializer = new MarkdownSerializer({
            // Nodes
            doc(state, node) {
                state.renderContent(node);
                // Ensure document ends with newline
                if (state.out && !state.out.endsWith('\n')) {
                    state.write('\n');
                }
            },
            paragraph(state, node) {
                state.renderInline(node);
                state.closeBlock(node);
            },
            blockquote(state, node) {
                state.wrapBlock('> ', null, node, () => state.renderContent(node));
            },
            codeBlock(state, node) {
                state.write('```' + (node.attrs.language || '') + '\n');
                state.text(node.textContent, false);
                state.ensureNewLine();
                state.write('```');
                state.closeBlock(node);
            },
            mermaid(state, node) {
                // Serialize mermaid diagrams back to markdown code blocks
                state.write('```mermaid\n');
                state.text(node.attrs.content || '', false);
                state.ensureNewLine();
                state.write('```');
                state.closeBlock(node);
            },
            heading(state, node) {
                state.write(state.repeat('#', node.attrs.level) + ' ');
                state.renderInline(node);
                state.closeBlock(node);
            },
            horizontalRule(state, node) {
                state.write(node.attrs.markup || '---');
                state.closeBlock(node);
            },
            hardBreak(state, node, parent, index) {
                for (let i = index + 1; i < parent.childCount; i++) {
                    if (parent.child(i).type !== node.type) {
                        state.write('\\\n');
                        return;
                    }
                }
            },
            orderedList(state, node) {
                const start = node.attrs.start || 1;
                const maxW = String(start + node.childCount - 1).length;
                const space = state.repeat(' ', maxW + 2);
                state.renderList(node, space, (i) => {
                    const nStr = String(start + i);
                    return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
                });
            },
            bulletList(state, node) {
                state.renderList(node, '  ', () => '- ');
            },
            listItem(state, node) {
                state.renderContent(node);
            },
            text(state, node) {
                state.text(node.text || '');
            },
            table(state, node) {
                state.write('\n');
                state.renderContent(node);
                state.closeBlock(node);
            },
            tableRow(state, node) {
                state.write('|');
                node.forEach((cell, _, i) => {
                    if (i) state.write('|');
                    state.renderInline(cell);
                });
                state.write('|\n');
                
                // Add separator row after header
                if (node === node.parent?.firstChild) {
                    state.write('|');
                    node.forEach((_, __, i) => {
                        if (i) state.write('|');
                        state.write('---');
                    });
                    state.write('|\n');
                }
            },
            tableCell(state, node) {
                state.write(' ');
                state.renderInline(node);
                state.write(' ');
            },
            tableHeader(state, node) {
                state.write(' ');
                state.renderInline(node);
                state.write(' ');
            },
        }, {
            // Marks
            em: { open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true },
            strong: { open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true },
            code: { open: '`', close: '`', escape: false },
            strike: { open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true },
            link: {
                open(_state, mark, parent, index) {
                    return '[';
                },
                close(state, mark, parent, index) {
                    return '](' + mark.attrs.href + (mark.attrs.title ? ' "' + mark.attrs.title + '"' : '') + ')';
                },
            },
        });

        const markdown = serializer.serialize(doc);
        console.log('[markdownUtils] Serialized markdown length:', markdown.length);
        console.log('[markdownUtils] First 200 chars:', markdown.substring(0, 200));
        return markdown;
    } catch (error) {
        console.error('[markdownUtils] Error serializing to markdown:', error);
        // Fallback to plain text
        return doc.textContent;
    }
}

