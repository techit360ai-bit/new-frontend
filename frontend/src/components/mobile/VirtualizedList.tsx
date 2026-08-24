import type { ReactNode } from "react";
import { Virtuoso } from "react-virtuoso";

export function VirtualizedList<T>({ items, itemContent, className, empty, threshold = 30, useWindowScroll = false }: { items: T[]; itemContent: (index: number, item: T) => ReactNode; className?: string; empty?: ReactNode; threshold?: number; useWindowScroll?: boolean }) {
  if (!items.length) return <>{empty}</>;
  if (items.length < threshold) return <>{items.map((item, index) => itemContent(index, item))}</>;
  if (useWindowScroll) return <Virtuoso useWindowScroll data={items} itemContent={itemContent} />;
  return <div className={className || "h-[min(70dvh,640px)]"}><Virtuoso data={items} itemContent={itemContent} /></div>;
}
