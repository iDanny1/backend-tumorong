import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

export interface PaperUnit {
  key: string;
  anchor?: string;
  content: ReactNode;
  keepNext?: boolean;
  newPage?: boolean;
  tableHeader?: number;
}
interface Piece { index: number; column?: number; }

// The measuring column uses the same fixed physical width and typography as a printed page.
export function ContractPages({units, paperRef, layoutKey}: {
  units: PaperUnit[]; paperRef: RefObject<HTMLDivElement | null>; layoutKey: string;
}) {
  const measure = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Piece[][]>([]);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = measure.current!;
    function paginate() {
      const capacity = node.clientHeight - 2;
      const blocks = Array.from(node.children) as HTMLElement[];
      const heights = blocks.map(el => el.getBoundingClientRect().height);
      const result: Piece[][] = [[]];
      let used = 0;
      const current = () => result[result.length - 1];
      function next() { if (current().length) result.push([]); used = 0; }
      function append(index: number) { current().push({index}); used += heights[index]; }
      units.forEach((unit, index) => {
        const height = heights[index];
        if (unit.newPage) next();
        // Keep headings together with at least the opening lines of the following text.
        let required = height;
        for (let i = index; units[i]?.keepNext && i + 1 < units.length; i++) {
          required += heights[i + 1] <= capacity ? heights[i + 1] : 50;
        }
        if (used && (used + height > capacity || (required <= capacity && used + required > capacity))) next();
        if (!current().length && unit.tableHeader !== undefined && unit.tableHeader !== index &&
            heights[unit.tableHeader] + height <= capacity) append(unit.tableHeader);
        if (height <= capacity) { append(index); return; }
        // An unusually long edited paragraph can span several sheets. Let the browser
        // fragment its lines inside fixed-height columns, including widow/orphan control.
        next();
        const probe = blocks[index].cloneNode(true) as HTMLElement;
        probe.classList.add('contract-long-columns');
        node.append(probe);
        const count = Math.max(1, Math.round(probe.scrollWidth / probe.clientWidth));
        probe.remove();
        for (let col = 0; col < count; col++) {
          current().push({index, column: col});
          if (col + 1 < count) next();
        }
        used = capacity;
      });
      setPages(result.filter(page => page.length));
    }
    paginate();
    // Fonts or a changed browser text size can change line breaks.
    const observer = new ResizeObserver(paginate);
    for (const block of Array.from(node.children)) observer.observe(block);
    return () => observer.disconnect();
  }, [layoutKey]);
  useLayoutEffect(() => {
    const el = viewport.current!;
    const fit = () => setScale(Math.min(1, el.clientWidth / (210 * 96 / 25.4)) || 1);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div className="contract-page-viewport" ref={viewport}>
    <div className="contract-paper contract-measure" ref={measure} aria-hidden="true" inert>
      {units.map(u => <div className="contract-unit" key={u.key}>{u.content}</div>)}
    </div>
    <div className="contract-sheets" ref={paperRef} style={{zoom: scale}}>
      {pages.map((pieces, page) => <article className="contract-paper contract-sheet" key={page} aria-label={'Trang ' + (page + 1)}>
        {pieces.map(({index, column}) => {
          const unit = units[index];
          if (!unit) return null;
          return <div className="contract-unit" key={unit.key} id={!column ? unit.anchor : undefined} tabIndex={unit.anchor ? -1 : undefined}>
            {column === undefined ? unit.content :
              <div className="contract-long-clip"><div className="contract-long-columns" style={{transform: 'translateX(-' + column * 100 + '%)'}}>{unit.content}</div></div>}
          </div>;
        })}
        <footer className="contract-page-number">{page + 1} / {pages.length}</footer>
      </article>)}
    </div>
  </div>;
}
