import { Marked, type Tokens } from "marked";

/**
 * Small Markdown pipeline for blog posts. Runs on the server at build time and ships
 * no JavaScript to the browser.
 *
 * Standard Markdown (GFM) plus a few block directives, each opened with `:::name` on its
 * own line and closed with `:::`:
 *
 *   :::takeaways            a "Key takeaways" list shown first (answer-first)
 *   :::callout note|caution [Optional title]
 *   :::faq                  `### Question` followed by the answer, repeated
 *
 * Raw HTML in posts is escaped, images are not supported yet (they need explicit
 * dimensions to avoid layout shift), and `# ` (h1) is reserved for the post title.
 */

export type FaqItem = { q: string; aHtml: string; aText: string };

export type Segment =
  | { type: "md"; html: string }
  | { type: "takeaways"; html: string }
  | { type: "callout"; variant: "note" | "caution"; title?: string; html: string }
  | { type: "faq"; items: FaqItem[] };

export type Heading = { id: string; text: string; depth: number };

export type RenderedMarkdown = {
  segments: Segment[];
  headings: Heading[];
  /** All visible text, used for the word count and reading time. */
  text: string;
  faq: FaqItem[];
};

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : +code.slice(1);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return entities[code.toLowerCase()] ?? m;
  });
}

/** Visible text of a fragment of our own rendered HTML. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\/(p|li|h[1-6]|tr|div|pre|blockquote)>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type Block =
  | { kind: "md"; text: string }
  | { kind: "directive"; name: string; args: string; text: string; line: number };

/** Split the body into Markdown chunks and `:::` directive blocks (fence-aware). */
function splitBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let md: string[] = [];
  let open: { name: string; args: string; line: number; lines: string[] } | null = null;
  let fence: string | null = null;

  const flushMd = () => {
    if (md.some((l) => l.trim())) blocks.push({ kind: "md", text: md.join("\n") });
    md = [];
  };

  lines.forEach((line, i) => {
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1]?.[0] ?? "`";
      if (fence === null) fence = marker;
      else if (marker === fence) fence = null;
    }
    const inFence = fence !== null;
    const target = open ? open.lines : md;

    if (!inFence && !fenceMatch) {
      const opening = /^:::\s*([a-z]+)\s*(.*)$/.exec(line);
      if (opening && !open) {
        flushMd();
        open = {
          name: opening[1] ?? "",
          args: (opening[2] ?? "").trim(),
          line: i + 1,
          lines: [],
        };
        return;
      }
      if (/^:::\s*$/.test(line)) {
        if (!open)
          throw new Error(`Line ${i + 1}: ":::" closes a block that was never opened.`);
        blocks.push({
          kind: "directive",
          name: open.name,
          args: open.args,
          text: open.lines.join("\n"),
          line: open.line,
        });
        open = null;
        return;
      }
      if (opening && open) {
        throw new Error(`Line ${i + 1}: ":::" blocks cannot be nested.`);
      }
    }
    target.push(line);
  });

  if (open)
    throw new Error(
      `Line ${(open as { line: number }).line}: ":::" block is never closed.`,
    );
  if (fence) throw new Error("A fenced code block is never closed.");
  flushMd();
  return blocks;
}

function createRenderer(headings: Heading[], used: Set<string>) {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading(
        this: { parser: { parseInline: (t: Tokens.Heading["tokens"]) => string } },
        token: Tokens.Heading,
      ) {
        if (token.depth === 1) {
          throw new Error(
            `Body contains an h1 ("${token.text}"). The post title is the h1; use ## for sections.`,
          );
        }
        const inner = this.parser.parseInline(token.tokens);
        const text = htmlToText(inner);
        let id = slugify(text);
        for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
        used.add(id);
        headings.push({ id, text, depth: token.depth });
        return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`;
      },
      html(token: Tokens.HTML | Tokens.Tag) {
        return escapeHtml(token.text);
      },
      image(token: Tokens.Image) {
        throw new Error(
          `Image "${token.href}": images are not supported in posts yet (they need explicit dimensions).`,
        );
      },
    },
  });
  return marked;
}

/** Make code and tables keyboard-scrollable instead of overflowing the page. */
function enhance(html: string): string {
  return html
    .replace(/<pre>/g, '<pre tabindex="0" role="region" aria-label="Code example">')
    .replace(
      /<table>/g,
      '<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table>',
    )
    .replace(/<\/table>/g, "</table></div>");
}

function parseFaq(text: string, md: (s: string) => string, line: number): FaqItem[] {
  const items: FaqItem[] = [];
  let q: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (q === null) return;
    const answer = buf.join("\n").trim();
    if (!answer)
      throw new Error(`FAQ block (line ${line}): question "${q}" has no answer.`);
    const aHtml = md(answer);
    items.push({ q, aHtml, aText: htmlToText(aHtml) });
  };
  for (const l of text.split("\n")) {
    const m = /^###\s+(.+?)\s*$/.exec(l);
    if (m) {
      flush();
      q = htmlToText(md(m[1] ?? "").replace(/^<p>|<\/p>\s*$/g, ""));
      buf = [];
    } else if (q === null) {
      if (l.trim())
        throw new Error(`FAQ block (line ${line}): start each item with "### Question".`);
    } else buf.push(l);
  }
  flush();
  if (!items.length) throw new Error(`FAQ block (line ${line}) has no questions.`);
  return items;
}

export function renderMarkdown(source: string): RenderedMarkdown {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const marked = createRenderer(headings, used);
  const renderBlock = (s: string) => enhance(marked.parse(s, { async: false }));
  // FAQ answers and callouts must not create headings that join the table of contents.
  const renderPlain = (s: string) => {
    const plain = new Marked({ gfm: true });
    plain.use({
      renderer: {
        html: (t: Tokens.HTML | Tokens.Tag) => escapeHtml(t.text),
        image: (t: Tokens.Image) => {
          throw new Error(`Image "${t.href}": images are not supported in posts yet.`);
        },
        heading: (t: Tokens.Heading) => {
          throw new Error(`Headings are not allowed inside ":::" blocks ("${t.text}").`);
        },
      },
    });
    return enhance(plain.parse(s, { async: false }));
  };

  const segments: Segment[] = [];
  const faq: FaqItem[] = [];
  for (const b of splitBlocks(source)) {
    if (b.kind === "md") {
      segments.push({ type: "md", html: renderBlock(b.text) });
      continue;
    }
    switch (b.name) {
      case "takeaways":
        segments.push({ type: "takeaways", html: renderPlain(b.text) });
        break;
      case "callout": {
        const [variantRaw = "note", ...rest] = b.args.split(/\s+/).filter(Boolean);
        if (variantRaw !== "note" && variantRaw !== "caution") {
          throw new Error(`Line ${b.line}: callout type must be "note" or "caution".`);
        }
        const title = rest.join(" ") || undefined;
        segments.push({
          type: "callout",
          variant: variantRaw,
          title,
          html: renderPlain(b.text),
        });
        break;
      }
      case "faq": {
        const items = parseFaq(b.text, renderPlain, b.line);
        faq.push(...items);
        segments.push({ type: "faq", items });
        break;
      }
      default:
        throw new Error(`Line ${b.line}: unknown block ":::${b.name}".`);
    }
  }

  const text = segments
    .map((s) =>
      s.type === "faq"
        ? s.items.map((i) => `${i.q} ${i.aText}`).join(" ")
        : htmlToText(s.html),
    )
    .join(" ");
  return { segments, headings, text, faq };
}
