import React from 'react';

function CodeBlock({ code }) {
  return (
    <div className="my-3 overflow-hidden rounded-2xl bg-slate-900 border border-slate-800">
      <div className="flex items-center justify-between bg-slate-850 px-4 py-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calculated Score Parameters</span>
      </div>
      <pre className="overflow-x-auto p-3 text-[11px] leading-5 text-sky-200"><code>{code}</code></pre>
    </div>
  );
}

function renderInline(text, onActionClick) {
  const parts = text.split(/(\[.+?\]\(action:.+?\))/g);
  return parts.map((part, index) => {
    const actionMatch = part.match(/\[(.+?)\]\(action:(.+?)\)/);
    if (actionMatch) {
      const [, label, actionId] = actionMatch;
      return (
        <button
          key={index}
          onClick={() => onActionClick && onActionClick(actionId)}
          className="inline-flex items-center font-bold text-blue-600 dark:text-blue-450 hover:underline border-none bg-transparent p-0 cursor-pointer"
        >
          {label}
        </button>
      );
    }
    return part;
  });
}

export default function MarkdownContent({ text, onActionClick }) {
  if (!text) return null;
  const parts = text.split(/```(?:\w+)?\n?|```/);
  return parts.map((part, index) => {
    if (index % 2 === 1) return <CodeBlock code={part.trim()} key={`code-${index}`} />;

    const lines = part.split('\n');
    const blocks = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const nextLine = lines[lineIndex + 1] || '';
      if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(nextLine)) {
        const headers = line.split('|').filter(Boolean).map(cell => cell.trim());
        const rows = [];
        lineIndex += 2;
        while (lineIndex < lines.length && lines[lineIndex].includes('|')) {
          rows.push(lines[lineIndex].split('|').filter(Boolean).map(cell => cell.trim()));
          lineIndex += 1;
        }
        lineIndex -= 1;
        blocks.push(
          <div className="my-3 overflow-x-auto rounded-xl border border-slate-205 dark:border-slate-800" key={`table-${lineIndex}`}>
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 dark:bg-slate-900/70 text-slate-655 dark:text-slate-350"><tr>{headers.map(header => <th className="px-2.5 py-2 font-bold" key={header}>{renderInline(header, onActionClick)}</th>)}</tr></thead>
              <tbody>{rows.map((row, rowIndex) => <tr className="border-t border-slate-100 dark:border-slate-800" key={rowIndex}>{row.map((cell, cellIndex) => <td className="px-2.5 py-2" key={cellIndex}>{renderInline(cell, onActionClick)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      } else if (/^\s*[-*]\s+/.test(line)) {
        const items = [];
        while (lineIndex < lines.length && /^\s*[-*]\s+/.test(lines[lineIndex])) {
          items.push(lines[lineIndex].replace(/^\s*[-*]\s+/, ''));
          lineIndex += 1;
        }
        lineIndex -= 1;
        blocks.push(<ul className="my-2 list-disc space-y-1 pl-4" key={`list-${lineIndex}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, onActionClick)}</li>)}</ul>);
      } else if (/^\s*\d+\.\s+/.test(line)) {
        blocks.push(<ol className="my-2 list-decimal pl-4" key={`ordered-${lineIndex}`}><li>{renderInline(line.replace(/^\s*\d+\.\s+/, ''), onActionClick)}</li></ol>);
      } else if (line.trim()) {
        blocks.push(<p className="mt-1.5 first:mt-0" key={`line-${lineIndex}`}>{renderInline(line, onActionClick)}</p>);
      }
    }
    return <React.Fragment key={`block-${index}`}>{blocks}</React.Fragment>;
  });
}
