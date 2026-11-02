export type Point = { x: number; y: number; label: 0 | 1; id: number };
export type Criterion = "gini" | "entropy";
export type Options = {
  maxDepth: number;
  minLeaf: number;
  criterion: Criterion;
};
export type Split = {
  feature: 0 | 1;
  threshold: number;
  gain: number;
  weighted: number;
  left: Point[];
  right: Point[];
};
export type Tree = {
  id: number;
  depth: number;
  samples: Point[];
  probability: number;
  prediction: 0 | 1;
  impurity: number;
  split?: Split;
  left?: Tree;
  right?: Tree;
};
export const featureNames = ["Temperature", "Vibration"];
export const value = (p: Point, feature: number) => (feature === 0 ? p.x : p.y);
export const percent = (n: number) => `${(100 * n).toFixed(1)}%`;
export function rng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function makeData(seed = 42, noise = 0.08, n = 240): Point[] {
  const random = rng(seed);
  return Array.from({ length: n }, (_, id) => {
    const x = random() * 10,
      y = random() * 10;
    let label = Number((x > 5.5 && y > 3) || y > 7.5);
    if (random() < noise) label = 1 - label;
    return { x, y, label: label as 0 | 1, id };
  });
}
export function partition(data: Point[]) {
  const shuffled = [...data],
    random = rng(7);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const a = Math.floor(data.length * 0.6),
    b = Math.floor(data.length * 0.8);
  return {
    train: shuffled.slice(0, a),
    validation: shuffled.slice(a, b),
    test: shuffled.slice(b),
  };
}
export function impurity(data: Point[], criterion: Criterion = "gini"): number {
  if (!data.length) return 0;
  const p = data.reduce((s, d) => s + d.label, 0) / data.length;
  if (criterion === "gini") return 1 - p * p - (1 - p) * (1 - p);
  return [p, 1 - p]
    .filter((v) => v > 0)
    .reduce((s, v) => s - v * Math.log2(v), 0);
}
export function evaluateSplit(
  data: Point[],
  feature: 0 | 1,
  threshold: number,
  criterion: Criterion = "gini",
): Split {
  const left = data.filter((p) => value(p, feature) <= threshold);
  const right = data.filter((p) => value(p, feature) > threshold);
  const weighted = data.length
    ? (left.length * impurity(left, criterion) +
        right.length * impurity(right, criterion)) /
      data.length
    : 0;
  return {
    feature,
    threshold,
    weighted,
    gain: impurity(data, criterion) - weighted,
    left,
    right,
  };
}
export function candidates(
  data: Point[],
  criterion: Criterion = "gini",
  minLeaf = 1,
): Split[] {
  const result: Split[] = [];
  for (const feature of [0, 1] as const) {
    const unique = [...new Set(data.map((p) => value(p, feature)))].sort(
      (a, b) => a - b,
    );
    for (let i = 1; i < unique.length; i++) {
      const split = evaluateSplit(
        data,
        feature,
        (unique[i - 1] + unique[i]) / 2,
        criterion,
      );
      if (split.left.length >= minLeaf && split.right.length >= minLeaf)
        result.push(split);
    }
  }
  return result.sort((a, b) => b.gain - a.gain);
}
export function train(data: Point[], options: Options): Tree {
  if (
    !data.length ||
    data.some(
      (p) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        ![0, 1].includes(p.label),
    )
  )
    throw new Error("Expected nonempty finite binary data.");
  if (
    !Number.isInteger(options.maxDepth) ||
    options.maxDepth < 0 ||
    !Number.isInteger(options.minLeaf) ||
    options.minLeaf < 1
  )
    throw new Error("Invalid depth or minimum leaf size.");
  let id = 0;
  function grow(rows: Point[], depth: number): Tree {
    const probability = rows.reduce((s, p) => s + p.label, 0) / rows.length;
    const node: Tree = {
      id: id++,
      depth,
      samples: rows,
      probability,
      prediction: probability > 0.5 ? 1 : 0,
      impurity: impurity(rows, options.criterion),
    };
    if (
      depth >= options.maxDepth ||
      node.impurity === 0 ||
      rows.length < 2 * options.minLeaf
    )
      return node;
    const best = candidates(rows, options.criterion, options.minLeaf)[0];
    // Local, greedy improvement; do not split on zero gain.
    if (!best || best.gain <= 1e-12) return node;
    node.split = best;
    node.left = grow(best.left, depth + 1);
    node.right = grow(best.right, depth + 1);
    return node;
  }
  return grow(data, 0);
}
export function predict(
  tree: Tree,
  point: Point,
  expanded?: Set<number>,
): Tree {
  if (!tree.split || (expanded && !expanded.has(tree.id))) return tree;
  return predict(
    value(point, tree.split.feature) <= tree.split.threshold
      ? tree.left!
      : tree.right!,
    point,
    expanded,
  );
}
export function flatten(tree: Tree): Tree[] {
  return [
    tree,
    ...(tree.left ? flatten(tree.left) : []),
    ...(tree.right ? flatten(tree.right) : []),
  ];
}
export function accuracy(
  tree: Tree,
  rows: Point[],
  expanded?: Set<number>,
): number {
  return rows.length
    ? rows.filter((p) => predict(tree, p, expanded).prediction === p.label)
        .length / rows.length
    : 0;
}
export function confusion(tree: Tree, rows: Point[]): number[][] {
  const matrix = [
    [0, 0],
    [0, 0],
  ];
  for (const row of rows) matrix[row.label][predict(tree, row).prediction]++;
  return matrix;
}
export const demoData: Point[] = [
  [1, 1, 0],
  [2, 2, 0],
  [2, 5, 0],
  [3, 3, 0],
  [4, 6, 0],
  [4, 8, 1],
  [6, 2, 0],
  [6, 5, 1],
  [7, 4, 1],
  [8, 7, 1],
  [9, 6, 1],
  [8, 9, 1],
].map(([x, y, label], id) => ({ x, y, label: label as 0 | 1, id }));
