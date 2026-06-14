# Stack build: first click should place exactly one block (manual verification)

1. Open **Build Mode** with at least 1 block in inventory.
2. Note `stackProgress` (e.g. `0/5`).
3. Align the mover with the target and click once.
4. **Expected:** `stackProgress` increases by 1 only (e.g. `1/5`), one new block appears.
5. **Previously broken:** first click showed 2 blocks / jumped to `2/5`.

Fix: removed optimistic `setPlacedBlocks` append; stack visuals sync only from `stackProgress` with a placement guard ref.
