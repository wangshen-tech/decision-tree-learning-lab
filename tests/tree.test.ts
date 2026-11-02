import { describe, expect, it } from "vitest";
import {
  accuracy,
  candidates,
  confusion,
  demoData,
  evaluateSplit,
  flatten,
  impurity,
  makeData,
  partition,
  predict,
  train,
  type Point,
} from "../src/lib/tree";
import reference from "../project/reference/results.json";
describe("Decision-tree algorithm", () => {
  it("matches hand-calculated Gini, entropy, and weighted gain", () => {
    const sample = demoData
      .slice(0, 4)
      .map((p, i) => ({ ...p, label: (i === 3 ? 1 : 0) as 0 | 1 }));
    expect(impurity(sample)).toBeCloseTo(0.375, 12);
    expect(impurity(sample, "entropy")).toBeCloseTo(0.8112781244591328, 12);
    expect(evaluateSplit(demoData, 0, 5).gain).toBeCloseTo(2 / 9, 12);
  });
  it("finds the true best valid root candidate", () => {
    const best = candidates(demoData)[0];
    const tree = train(demoData, {
      maxDepth: 1,
      minLeaf: 1,
      criterion: "gini",
    });
    expect(tree.split?.threshold).toBe(best.threshold);
    expect(tree.split?.feature).toBe(best.feature);
    for (const c of candidates(demoData))
      expect(c.gain).toBeLessThanOrEqual(best.gain);
  });
  it("uses <= at a boundary, preserves counts, and obeys depth and minimum leaf size", () => {
    const tree = train(partition(makeData()).train, {
      maxDepth: 4,
      minLeaf: 3,
      criterion: "gini",
    });
    for (const node of flatten(tree)) {
      expect(node.depth).toBeLessThanOrEqual(4);
      if (node.split) {
        expect(node.left!.samples.length + node.right!.samples.length).toBe(
          node.samples.length,
        );
        expect(node.split.gain).toBeGreaterThan(0);
      } else expect(node.samples.length).toBeGreaterThanOrEqual(3);
    }
    const row = { x: 0, y: 0, id: -1, label: 0 } as Point;
    row[tree.split!.feature === 0 ? "x" : "y"] = tree.split!.threshold;
    const expanded = new Set([tree.id]);
    expect(predict(tree, row, expanded).id).toBe(tree.left!.id);
  });
  it("handles pure, constant, tied, and invalid data", () => {
    const rows: Point[] = [
      { x: 1, y: 1, label: 0, id: 0 },
      { x: 1, y: 1, label: 1, id: 1 },
    ];
    const tree = train(rows, { maxDepth: 3, minLeaf: 1, criterion: "gini" });
    expect(tree.split).toBeUndefined();
    expect(tree.prediction).toBe(0);
    expect(
      train(
        demoData.filter((p) => p.label === 0),
        { maxDepth: 3, minLeaf: 1, criterion: "gini" },
      ).split,
    ).toBeUndefined();
    expect(() =>
      train([], { maxDepth: 3, minLeaf: 1, criterion: "gini" }),
    ).toThrow();
    expect(() =>
      train(rows, { maxDepth: 3, minLeaf: 0, criterion: "gini" }),
    ).toThrow();
  });
  it("matches actual Python data and all eight default experiment scores", () => {
    const data = makeData(),
      split = partition(data);
    expect([data[0].x, data[0].y]).toEqual(reference.first_row);
    expect([
      split.train.length,
      split.validation.length,
      split.test.length,
    ]).toEqual([144, 48, 48]);
    expect(
      new Set(
        [...split.train, ...split.validation, ...split.test].map((p) => p.id),
      ).size,
    ).toBe(240);
    for (const row of reference.experiments) {
      const tree = train(split.train, {
        maxDepth: row.depth,
        minLeaf: 3,
        criterion: "gini",
      });
      expect(accuracy(tree, split.train)).toBeCloseTo(row.train_accuracy, 12);
      expect(accuracy(tree, split.validation)).toBeCloseTo(
        row.validation_accuracy,
        12,
      );
    }
    const chosen = train(split.train, {
      maxDepth: reference.selected_depth,
      minLeaf: 3,
      criterion: "gini",
    });
    expect(confusion(chosen, split.test)).toEqual(
      reference.scratch_test.confusion_matrix,
    );
  });
  it("generates different data from a new seed and learns useful boundaries", () => {
    expect(makeData(42)[0]).not.toEqual(makeData(43)[0]);
    const split = partition(makeData(42, 0));
    const tree = train(split.train, {
      maxDepth: 4,
      minLeaf: 1,
      criterion: "entropy",
    });
    expect(accuracy(tree, split.validation)).toBeGreaterThan(0.85);
  });
});
