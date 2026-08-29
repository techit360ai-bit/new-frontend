import { useEffect, useRef, useState } from "react";

export function useMobileChromeVisibility(open = false) {
  const [visible, setVisible] = useState(true);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const onScroll = (event: Event) => {
      if (open) return;
      const target = event.target instanceof HTMLElement ? event.target : document.documentElement;
      const scrollTop = target.scrollTop;
      const delta = scrollTop - lastScrollTop.current;
      if (Math.abs(delta) < 8) return;
      setVisible(delta < 0 || scrollTop < 16);
      lastScrollTop.current = scrollTop;
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  return visible;
}
