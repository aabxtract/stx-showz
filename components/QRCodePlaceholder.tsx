export default function QRCodePlaceholder({ value }: { value: string }) {
  // Deterministic pseudo-pattern from the value
  const size = 12;
  const cells: boolean[] = [];
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < size * size; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    cells.push((hash & 1) === 1);
  }

  return (
    <div className="inline-block bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {cells.map((on, i) => {
          // Force corner finder patterns
          const row = Math.floor(i / size);
          const col = i % size;
          const corner =
            (row < 3 && col < 3) ||
            (row < 3 && col >= size - 3) ||
            (row >= size - 3 && col < 3);
          const filled = corner ? (row + col) % 3 !== 1 : on;
          return (
            <div
              key={i}
              className={`w-3 xs:w-4 h-3 xs:h-4 rounded-[2px] ${
                filled ? "bg-slate-900" : "bg-transparent"
              }`}
            />
          );
        })}
      </div>
      <div className="text-center text-[10px] font-mono text-slate-500 mt-3 tracking-wide">
        {value}
      </div>
    </div>
  );
}
