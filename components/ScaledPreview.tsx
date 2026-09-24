"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a real desktop width and scales them to fit the box, so
 * a thumbnail shows the actual desktop layout rather than the narrow one the
 * box width would otherwise trigger. The content is inert: it is a picture of
 * a page, not a second copy of it to tab through.
 */
export function ScaledPreview({
  width = 1280,
  initialScale = 0.48,
  className,
  children,
}: {
  width?: number;
  initialScale?: number;
  className?: string;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(initialScale);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={boxRef} className={className} style={{ overflow: "hidden" }}>
      <div
        inert
        style={{
          width,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
