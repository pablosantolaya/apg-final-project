type LineKind = 'same' | 'removed' | 'added' | 'empty';
interface DiffLine { kind: LineKind; text: string }

function lineDiff(orig: string[], tail: string[]): { left: DiffLine[]; right: DiffLine[] } {
  const m = orig.length, n = tail.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = orig[i - 1] === tail[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack to edit script
  const ops: Array<{ type: 'same' | 'del' | 'ins'; text: string }> = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && orig[i - 1] === tail[j - 1]) {
      ops.unshift({ type: 'same', text: orig[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'ins', text: tail[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'del', text: orig[i - 1] });
      i--;
    }
  }

  // Pair consecutive del/ins so rewritten lines appear side-by-side
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op.type === 'same') {
      left.push({ kind: 'same', text: op.text });
      right.push({ kind: 'same', text: op.text });
      k++;
    } else {
      const dels: string[] = [];
      const ins: string[] = [];
      while (k < ops.length && (ops[k].type === 'del' || ops[k].type === 'ins')) {
        if (ops[k].type === 'del') dels.push(ops[k].text);
        else ins.push(ops[k].text);
        k++;
      }
      const maxLen = Math.max(dels.length, ins.length);
      for (let p = 0; p < maxLen; p++) {
        left.push(p < dels.length ? { kind: 'removed', text: dels[p] } : { kind: 'empty', text: '' });
        right.push(p < ins.length ? { kind: 'added', text: ins[p] } : { kind: 'empty', text: '' });
      }
    }
  }

  return { left, right };
}

const BG: Record<LineKind, string> = {
  same: '',
  removed: 'bg-red-50 text-red-700',
  added: 'bg-green-50 text-green-700',
  empty: 'bg-neutral-50',
};

function DiffColumn({ lines, header }: { lines: DiffLine[]; header: string }) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-3 py-1.5 z-10">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{header}</span>
      </div>
      <div className="p-3 space-y-0.5">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`text-xs leading-relaxed px-1 rounded min-h-[1.25rem] ${BG[line.kind]}`}
          >
            {line.text || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  original: string;
  tailored: string;
}

export function ResumeDiff({ original, tailored }: Props) {
  const origLines = original.split('\n');
  const tailLines = tailored.split('\n');
  const { left, right } = lineDiff(origLines, tailLines);

  return (
    <div className="flex border border-neutral-200 rounded-xl overflow-hidden max-h-[60vh]">
      <DiffColumn lines={left} header="Original" />
      <div className="w-px bg-neutral-200 shrink-0" />
      <DiffColumn lines={right} header="Tailored" />
    </div>
  );
}
