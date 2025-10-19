
import React from "react";

export function formatMessage(content) {
  // Regex to detect phone numbers in +92 format
  const phoneRegex = /(\+92\s?\d{3}\s?\d{7})/g;

  return content.split(phoneRegex).map((part, i) => {
    if (phoneRegex.test(part)) {
      // Clean number f
      const cleanNumber = part.replace(/\s+/g, "").replace("+", "");
      return (
        <a
          key={i}
          href={`https://wa.me/${cleanNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-800 hover:underline cursor-pointer"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
