"use client";

import { useRef } from "react";

export function MobilePortfolioNavigation({ items }: {
  items: { id: string; label: string }[];
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  return (
    <details
      className="portfolio-mobile-menu"
      ref={menuRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuRef.current?.open) {
          menuRef.current.open = false;
          menuRef.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>Sections <span aria-hidden="true">☰</span></summary>
      <div className="portfolio-mobile-links">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`} onClick={() => {
            if (menuRef.current) menuRef.current.open = false;
          }}>{item.label}<span aria-hidden="true">↗</span></a>
        ))}
      </div>
    </details>
  );
}
