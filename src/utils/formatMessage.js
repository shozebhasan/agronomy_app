import React from "react";

// Parse a text segment for **bold** markers and return mixed text/bold elements
function parseBold(text, keyPrefix) {
  if (!text.includes("**")) return [<span key={keyPrefix}>{text}</span>];

  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}-plain-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    parts.push(
      <strong key={`${keyPrefix}-bold-${match.index}`} className="font-bold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`${keyPrefix}-plain-end`}>{text.slice(lastIndex)}</span>
    );
  }

  return parts;
}

export function formatMessage(content) {
  if (!content) return null;

  // Combined regex that handles:
  // 1. Markdown links: [text](url)
  // 2. Bare URLs: https://... or http://...
  // 3. WhatsApp links: wa.me/...
  // 4. Phone numbers: +92 format
  const combinedRegex =
    /(\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(https?:\/\/[^\s]+)|(wa\.me\/[^\s]+)|(\+92\s?\d{3}\s?\d{7})/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add plain text (with bold parsing) before this match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore) {
        parts.push(...parseBold(textBefore, `pre-${lastIndex}`));
      }
    }

    const key = `link-${match.index}`;

    if (match[1]) {
      // Case 1: Markdown link [text](url)
      parts.push(
        <a
          key={key}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 break-all font-medium"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      // Case 2: Bare URL https://...
      const cleanUrl = match[4].replace(/[.,;!?]$/, "");
      const trailingChar =
        match[4].length > cleanUrl.length ? match[4].slice(-1) : "";
      parts.push(
        <React.Fragment key={key}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 break-all font-medium"
          >
            {cleanUrl}
          </a>
          {trailingChar}
        </React.Fragment>
      );
    } else if (match[5]) {
      // Case 3: wa.me WhatsApp link
      parts.push(
        <a
          key={key}
          href={`https://${match[5]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 underline hover:text-green-800 break-all font-medium"
        >
          {match[5]}
        </a>
      );
    } else if (match[6]) {
      // Case 4: Phone number +92...
      const cleanNumber = match[6].replace(/\s+/g, "").replace("+", "");
      parts.push(
        <a
          key={key}
          href={`https://wa.me/${cleanNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-800 underline cursor-pointer font-medium"
        >
          {match[6]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match — also parse for bold
  if (lastIndex < content.length) {
    parts.push(...parseBold(content.slice(lastIndex), "post-end"));
  }

  return parts.length > 0 ? parts : content;
}