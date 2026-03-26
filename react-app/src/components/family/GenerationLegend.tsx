export default function GenerationLegend() {
  return (
    <div className="gen-legend">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((g) => (
        <div className="gen-legend-item" key={g}>
          <div
            className="gen-legend-dot"
            style={{ background: `var(--gen${g})` }}
          />
          G{g}
        </div>
      ))}
    </div>
  );
}
