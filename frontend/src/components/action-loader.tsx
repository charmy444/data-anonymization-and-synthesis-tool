"use client";

import type { CSSProperties } from "react";

type ActionLoaderProps = {
  word: string;
  className?: string;
};

export function ActionLoader({
  word,
  className,
}: ActionLoaderProps) {
  const normalized = word.replace(/\s+/g, " ").trim();

  return (
    <span className={`action-loader${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{normalized}</span>
      <span className="action-loader__wrapper" aria-hidden="true">
        {Array.from(normalized).map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="action-loader__letter"
            style={{ ["--loader-index" as "--loader-index"]: index } as CSSProperties}
          >
            {character === " " ? "\u00A0" : character}
          </span>
        ))}
        <span className="action-loader__beam" />
      </span>
    </span>
  );
}
