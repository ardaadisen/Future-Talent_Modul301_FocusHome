import AppCard from "./AppCard";

const ASSET_LABEL = {
  empty: "",
  wall: "WALL",
  window: "WINDOW",
  roof: "ROOF",
};

export default function HomeGrid({ grid, onPlaceAsset }) {
  return (
    <AppCard title="5x5 Home Grid">
      <div className="grid5">
        {grid.flatMap((row, rIdx) =>
          row.map((cell, cIdx) => {
            const filled = cell !== "empty";
            return (
              <button
                type="button"
                key={`${rIdx}-${cIdx}`}
                className={`cell ${filled ? "cell-filled" : ""}`}
                onClick={() => onPlaceAsset(rIdx, cIdx)}
                title={filled ? "Occupied cell" : "Place mock wall"}
              >
                {ASSET_LABEL[cell]}
              </button>
            );
          }),
        )}
      </div>
      <p className="muted" style={{ marginBottom: 0 }}>
        Click an empty cell to place a mock wall. Filled cells are protected.
      </p>
    </AppCard>
  );
}
