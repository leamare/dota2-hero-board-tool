import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * A very small markdown subset for translated prose: `**bold**`, `` `code` ``
 * and `[label](target)`.
 *
 * Docs text carries emphasis and links, and translators shouldn't have to be
 * handed JSX to keep them. Anything unrecognised is left as plain text, so a
 * stray bracket in a translation renders rather than breaking the page.
 */

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

const renderLink = (label: string, target: string, key: number): ReactNode =>
  /^https?:\/\//.test(target) ? (
    <a key={key} href={target} target="_blank" rel="noreferrer">
      {label}
    </a>
  ) : (
    <Link key={key} to={target}>
      {label}
    </Link>
  );

export function rich(text: string): ReactNode[] {
  // splitting on a capturing pattern leaves empty strings around a match at
  // either end; dropping them keeps the output to the parts that render
  return text
    .split(TOKEN)
    .filter(Boolean)
    .map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return renderLink(link[1], link[2], i);
    return <Fragment key={i}>{part}</Fragment>;
    });
}

/** Inline rich text. */
export default function Rich({ text }: { text: string }) {
  return <>{rich(text)}</>;
}
