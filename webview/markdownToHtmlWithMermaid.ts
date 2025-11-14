// @ts-ignore
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    typographer: true,
});

/**
 * Custom markdown-it plugin to detect mermaid code blocks
 * and convert them to special div elements
 */
function mermaidPlugin(md: any) {
    const defaultFence = md.renderer.rules.fence;

    md.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
        const token = tokens[idx];
        const info = token.info ? String(token.info).trim() : '';
        const language = info.split(/\s+/g)[0];

        if (language === 'mermaid') {
            const content = token.content;
            // Return special div that our Tiptap extension will parse
            return `<div data-mermaid-content="${escapeAttr(content)}" class="mermaid-wrapper"></div>\n`;
        }

        return defaultFence(tokens, idx, options, env, self);
    };
}

function escapeAttr(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

md.use(mermaidPlugin);

export { md };

