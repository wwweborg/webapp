import { createLowlight, all } from 'lowlight';

// Initialize lowlight with all bundled grammars
export const lowlight = createLowlight(all);

// 1. Custom Grammar for TPI / DOQ
function tpiGrammar(hljs: any) {
  return {
    name: 'TPI',
    aliases: ['tpi', 'doq'],
    keywords: {
      keyword:
        'const let var function return if else for while do switch case break continue import export from as default package use async await yield class extends implements interface type enum public private protected readonly static new this self super try catch finally throw def fn struct impl pub mut val fun typeof instanceof',
      literal: 'true false null undefined nil None NaN Infinity',
      type:
        'string number boolean any void never object unknown int float str bool list dict tuple Array Record Promise Set Map Console window document process Math JSON Date Error',
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.HASH_COMMENT_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'string',
        begin: '`',
        end: '`',
        contains: [hljs.BACKSLASH_ESCAPE],
      },
      hljs.C_NUMBER_MODE,
      {
        className: 'title.function_',
        begin: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*\()/,
      },
      {
        className: 'operator',
        begin: /=>|===|!==|==|!=|&&|\|\||\?\?|>=|<=|[+\-*\/%><=]/,
      },
    ],
  };
}

// Register custom language
lowlight.register('tpi', tpiGrammar);

// Register aliases for all supported languages
lowlight.registerAlias('typescript', ['ts', 'tsx']);
lowlight.registerAlias('javascript', ['js', 'jsx']);
lowlight.registerAlias('python', ['py']);
lowlight.registerAlias('bash', ['sh', 'shell']);
lowlight.registerAlias('yaml', ['yml']);
lowlight.registerAlias('rust', ['rs']);
lowlight.registerAlias('ruby', ['rb']);
lowlight.registerAlias('xml', ['html']);
lowlight.registerAlias('tpi', ['doq']);

// Token matching regexes according to user specification
const TYPES_REGEX =
  /\b(string|number|boolean|any|void|never|object|unknown|int|float|str|bool|list|dict|tuple|Array|Record|Promise|Set|Map|Console|window|document|process|Math|JSON|Date|Error)\b/;
const LITERALS_REGEX = /\b(true|false|null|undefined|nil|None|NaN|Infinity)\b/;
const KEYWORDS_REGEX =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|from|as|default|package|use|async|await|yield|class|extends|implements|interface|type|enum|public|private|protected|readonly|static|new|this|self|super|try|catch|finally|throw|def|fn|struct|impl|pub|mut|val|fun|typeof|instanceof)\b/;

// Combined token parser for raw text enhancement
const COMBINED_TOKEN_REGEX =
  /(=>|===|!==|==|!=|&&|\|\||\?\?|>=|<=|[+\-*\/%><=]|\b(?:string|number|boolean|any|void|never|object|unknown|int|float|str|bool|list|dict|tuple|Array|Record|Promise|Set|Map|Console|window|document|process|Math|JSON|Date|Error)\b|\b(?:true|false|null|undefined|nil|None|NaN|Infinity)\b|\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|from|as|default|package|use|async|await|yield|class|extends|implements|interface|type|enum|public|private|protected|readonly|static|new|this|self|super|try|catch|finally|throw|def|fn|struct|impl|pub|mut|val|fun|typeof|instanceof)\b|\b[A-Za-z_$][A-Za-z0-9_$]*(?=\s*\())/g;

export function enhanceSyntaxTree(nodes: any[], isHtml = false): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (node.type === 'element') {
      result.push({
        ...node,
        children: node.children ? enhanceSyntaxTree(node.children, isHtml) : [],
      });
    } else if (node.type === 'text' && typeof node.value === 'string') {
      const text = node.value;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const regex = new RegExp(COMBINED_TOKEN_REGEX);
      const parts: any[] = [];

      while ((match = regex.exec(text)) !== null) {
        const token = match[0];
        // In HTML, avoid splitting tag brackets
        if (isHtml && (token === '<' || token === '>')) {
          continue;
        }

        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex, match.index),
          });
        }

        let className = 'hljs-operator';
        if (TYPES_REGEX.test(token)) {
          className = 'hljs-type';
        } else if (LITERALS_REGEX.test(token)) {
          className = 'hljs-literal';
        } else if (KEYWORDS_REGEX.test(token)) {
          className = 'hljs-keyword';
        } else if (text.slice(match.index + token.length).match(/^\s*\(/)) {
          className = 'hljs-title function_';
        }

        parts.push({
          type: 'element',
          tagName: 'span',
          properties: { className: [className] },
          children: [{ type: 'text', value: token }],
        });

        lastIndex = match.index + token.length;
      }

      if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
      }

      result.push(...(parts.length ? parts : [node]));
    } else {
      result.push(node);
    }
  }
  return result;
}

// Enhance lowlight's highlight and highlightAuto methods so TipTap and other consumers get the tokens
const originalHighlight = lowlight.highlight.bind(lowlight);
const originalHighlightAuto = lowlight.highlightAuto.bind(lowlight);

lowlight.highlight = (language: string, value: string) => {
  const isHtml = language === 'html' || language === 'xml';
  try {
    const res = originalHighlight(language, value);
    return {
      ...res,
      children: enhanceSyntaxTree(res.children, isHtml),
    };
  } catch {
    const res = originalHighlightAuto(value);
    return {
      ...res,
      children: enhanceSyntaxTree(res.children, false),
    };
  }
};

lowlight.highlightAuto = (value: string, options?: any) => {
  const res = originalHighlightAuto(value, options);
  return {
    ...res,
    children: enhanceSyntaxTree(res.children, false),
  };
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function nodesToHtml(nodes: any[]): string {
  let html = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      html += escapeHtml(node.value);
    } else if (node.type === 'element') {
      const tag = node.tagName || 'span';
      const className = node.properties?.className
        ? Array.isArray(node.properties.className)
          ? node.properties.className.join(' ')
          : node.properties.className
        : '';
      const classAttr = className ? ` class="${className}"` : '';
      html += `<${tag}${classAttr}>${nodesToHtml(node.children || [])}</${tag}>`;
    }
  }
  return html;
}

/**
 * Highlights a snippet of code and returns HTML with standard hljs classes
 */
export function highlightCode(code: string, language?: string): string {
  if (!code) return '';
  const lang = language ? language.toLowerCase().trim() : '';

  try {
    if (lang && lowlight.registered(lang)) {
      const highlighted = lowlight.highlight(lang, code);
      return nodesToHtml(highlighted.children);
    }
    const auto = lowlight.highlightAuto(code);
    return nodesToHtml(auto.children);
  } catch {
    return escapeHtml(code);
  }
}
