import React from "react";
import type {
  RichBlock,
  RichInline,
  RichListBlock,
  RichText,
} from "@/logic";

// Draws the blocks of a support page. The backend and getFooterPage have
// already removed everything unsafe: links are https, http, mailto: or tel:.

function TextPiece({ node }: { node: RichText }) {
  let out: React.ReactNode = node.text;
  if (node.italic) out = <em>{out}</em>;
  if (node.bold) out = <strong className="font-semibold text-zinc-900">{out}</strong>;
  return <>{out}</>;
}

function Inline({ nodes }: { nodes: RichInline[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === "break") return <br key={index} />;
        if (node.type === "link") {
          const web = /^https?:/i.test(node.href);
          return (
            <a
              key={index}
              href={node.href}
              {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition"
            >
              {node.children.map((child, i) => (
                <TextPiece key={i} node={child} />
              ))}
            </a>
          );
        }
        return <TextPiece key={index} node={node} />;
      })}
    </>
  );
}

const BULLETS = ["list-disc", "list-[circle]", "list-[square]", "list-[square]"];

function List({ list, depth }: { list: RichListBlock; depth: number }) {
  const Tag = list.ordered ? "ol" : "ul";
  const style = list.ordered ? "list-decimal" : BULLETS[Math.min(depth, 3)];
  return (
    <Tag className={`${style} pl-6 space-y-1.5 ${depth > 0 ? "mt-1.5" : ""}`}>
      {list.items.map((item, index) => (
        <li key={index}>
          <Inline nodes={item.content} />
          {item.children.map((child, i) => (
            <List key={i} list={child} depth={depth + 1} />
          ))}
        </li>
      ))}
    </Tag>
  );
}

// The page title is already the page's h1, so a heading of the text is one level
// below it: a level 1 heading becomes an h2, and so on.
const HEADINGS = {
  1: { Tag: "h2", className: "text-xl font-semibold text-zinc-900 pt-4" },
  2: { Tag: "h3", className: "text-lg font-semibold text-zinc-900 pt-3" },
  3: { Tag: "h4", className: "text-base font-semibold text-zinc-900 pt-2" },
} as const;

export function RichBlocks({ blocks }: { blocks: RichBlock[] }) {
  return (
    <div
      data-testid="support-page-text"
      className="space-y-4 text-sm leading-7 text-zinc-700"
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const { Tag, className } = HEADINGS[block.level];
          return (
            <Tag key={index} className={className}>
              <Inline nodes={block.content} />
            </Tag>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              <Inline nodes={block.content} />
            </p>
          );
        }
        if (block.type === "rule") {
          return <hr key={index} className="border-zinc-200 my-6" />;
        }
        return <List key={index} list={block} depth={0} />;
      })}
    </div>
  );
}
