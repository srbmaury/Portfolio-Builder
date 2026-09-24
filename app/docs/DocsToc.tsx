"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./docs.module.css";

type TocItem = { id: string; label: string };

// A section counts as "current" once its top has scrolled past this line,
// which sits below the sticky header (and, on narrow screens, the sticky
// contents strip under it).
const ACTIVE_LINE = 140;

export function DocsToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(items[items.length - 1]?.id);
        return;
      }

      let current = items[0]?.id;
      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= ACTIVE_LINE) {
          current = item.id;
        }
      }
      setActiveId(current);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // On narrow screens the contents list is a horizontal chip row; keep the
  // active chip in view without moving the page itself.
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLAnchorElement>('[aria-current="location"]');
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const target = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId]);

  return (
    <aside className={styles.sidebar}>
      <p>On this page</p>
      <nav ref={navRef} aria-label="On this page">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={item.id === activeId ? "location" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
