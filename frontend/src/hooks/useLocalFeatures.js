import { useCallback, useState } from "react";
import { readJson, STORAGE_KEYS, writeJson } from "../utils/localStore";

function createDecoration(catalogItem) {
  return {
    id: crypto.randomUUID(),
    catalogId: catalogItem.id,
    category: catalogItem.category,
    label: catalogItem.label,
    emoji: catalogItem.emoji,
    x: 45 + Math.random() * 10,
    y: 45 + Math.random() * 10,
    rotation: 0,
    zIndex: 1,
  };
}

/** Local-only features — TODO: backend persistence for decorations, archive, build progress. */
export function useLocalFeatures() {
  const [decorations, setDecorationsState] = useState(() =>
    readJson(STORAGE_KEYS.decorations, []),
  );
  const [archive, setArchiveState] = useState(() =>
    readJson(STORAGE_KEYS.archive, []),
  );
  const [buildProgress, setBuildProgressState] = useState(() =>
    readJson(STORAGE_KEYS.buildProgress, { spentBricks: 0, stackLayers: 0 }),
  );

  const persistDecorations = useCallback((next) => {
    setDecorationsState(next);
    writeJson(STORAGE_KEYS.decorations, next);
  }, []);

  const persistArchive = useCallback((next) => {
    setArchiveState(next);
    writeJson(STORAGE_KEYS.archive, next);
  }, []);

  const persistBuildProgress = useCallback((next) => {
    setBuildProgressState(next);
    writeJson(STORAGE_KEYS.buildProgress, next);
  }, []);

  const addDecoration = useCallback(
    (catalogItem) => {
      const item = createDecoration(catalogItem);
      persistDecorations((prev) => [...prev, { ...item, zIndex: prev.length + 1 }]);
      return item;
    },
    [persistDecorations],
  );

  const updateDecoration = useCallback(
    (id, patch) => {
      persistDecorations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      );
    },
    [persistDecorations],
  );

  const removeDecoration = useCallback(
    (id) => {
      persistDecorations((prev) => prev.filter((d) => d.id !== id));
    },
    [persistDecorations],
  );

  const reorderDecoration = useCallback(
    (id, direction) => {
      persistDecorations((prev) => {
        const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((d) => d.id === id);
        if (idx < 0) {
          return prev;
        }
        const swapIdx = direction === "front" ? idx + 1 : idx - 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) {
          return prev;
        }
        const a = sorted[idx];
        const b = sorted[swapIdx];
        return prev.map((d) => {
          if (d.id === a.id) {
            return { ...d, zIndex: b.zIndex };
          }
          if (d.id === b.id) {
            return { ...d, zIndex: a.zIndex };
          }
          return d;
        });
      });
    },
    [persistDecorations],
  );

  const saveToArchive = useCallback(
    (entry) => {
      persistArchive((prev) => [
        {
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ]);
    },
    [persistArchive],
  );

  const addBuildSpend = useCallback(
    (bricks) => {
      persistBuildProgress((prev) => ({
        spentBricks: prev.spentBricks + bricks,
        stackLayers: prev.stackLayers + 1,
      }));
    },
    [persistBuildProgress],
  );

  return {
    decorations,
    archive,
    buildProgress,
    addDecoration,
    updateDecoration,
    removeDecoration,
    reorderDecoration,
    saveToArchive,
    addBuildSpend,
    setDecorations: persistDecorations,
  };
}
