import { useMemo } from "react";
import {
  type Point,
  type Tree,
  type Split,
  predict,
  featureNames,
} from "../lib/tree";

type Region = { x: number; y: number; w: number; h: number; node: Tree };
function regions(
  node: Tree,
  box: Omit<Region, "node">,
  expanded?: Set<number>,
): Region[] {
  if (!node.split || (expanded && !expanded.has(node.id)))
    return [{ ...box, node }];
  const t = node.split.threshold;
  return node.split.feature === 0
    ? [
        ...regions(node.left!, { ...box, w: t - box.x }, expanded),
        ...regions(
          node.right!,
          { ...box, x: t, w: box.x + box.w - t },
          expanded,
        ),
      ]
    : [
        ...regions(node.left!, { ...box, h: t - box.y }, expanded),
        ...regions(
          node.right!,
          { ...box, y: t, h: box.y + box.h - t },
          expanded,
        ),
      ];
}
export function Scatter({
  data,
  tree,
  split,
  expanded,
  query,
  onQuery,
  small = false,
}: {
  data: Point[];
  tree?: Tree;
  split?: Split;
  expanded?: Set<number>;
  query?: Point;
  onQuery?: (p: Point) => void;
  small?: boolean;
}) {
  const x = (v: number) => 54 + v * 38,
    y = (v: number) => 322 - v * 28;
  const areas = tree
    ? regions(tree, { x: 0, y: 0, w: 10, h: 10 }, expanded)
    : [];
  return (
    <svg
      className={`scatter ${small ? "small" : ""}`}
      viewBox="0 0 470 375"
      role="img"
      aria-label="Temperature versus vibration scatterplot. Circles are normal, triangles are alerts. Shaded rectangles show predicted classes."
      onClick={
        onQuery
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - rect.left) * 470) / rect.width;
              const py = ((e.clientY - rect.top) * 375) / rect.height;
              onQuery({
                x: Math.max(0, Math.min(10, (px - 54) / 38)),
                y: Math.max(0, Math.min(10, (322 - py) / 28)),
                label: 0,
                id: -1,
              });
            }
          : undefined
      }
    >
      <rect x="54" y="42" width="380" height="280" rx="1" fill="#f8faf5" />
      {areas.map((a) => (
        <rect
          key={a.node.id}
          x={x(a.x)}
          y={y(a.y + a.h)}
          width={a.w * 38}
          height={a.h * 28}
          fill={a.node.prediction === 0 ? "#dcebe0" : "#f6dfca"}
          stroke="#ffffff"
          strokeWidth="1.2"
        />
      ))}
      {split && (
        <>
          <rect
            x="54"
            y="42"
            width={split.feature === 0 ? split.threshold * 38 : 380}
            height={split.feature === 0 ? 280 : (10 - split.threshold) * 28}
            fill={split.feature === 0 ? "#dcebe070" : "#f6dfca70"}
          />
          <line
            x1={split.feature === 0 ? x(split.threshold) : 54}
            y1={split.feature === 0 ? 42 : y(split.threshold)}
            x2={split.feature === 0 ? x(split.threshold) : 434}
            y2={split.feature === 0 ? 322 : y(split.threshold)}
            stroke="#233e37"
            strokeWidth="2"
            strokeDasharray="6 5"
          />
        </>
      )}
      {[0, 2, 4, 6, 8, 10].map((v) => (
        <g key={v}>
          <line
            x1={x(v)}
            y1="42"
            x2={x(v)}
            y2="322"
            stroke="#8d9b8d"
            opacity=".13"
          />
          <line
            x1="54"
            y1={y(v)}
            x2="434"
            y2={y(v)}
            stroke="#8d9b8d"
            opacity=".13"
          />
          <text x={x(v)} y="342" textAnchor="middle">
            {v}
          </text>
          <text x="39" y={y(v) + 4} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {data.map((p) => (
        <g key={p.id}>
          <title>{`#${p.id}: temperature ${p.x.toFixed(2)}, vibration ${p.y.toFixed(2)}, ${p.label ? "alert" : "normal"}`}</title>
          {p.label === 0 ? (
            <circle
              cx={x(p.x)}
              cy={y(p.y)}
              r={data.length > 40 ? 4.1 : 6}
              fill="#337f6a"
              stroke="white"
              strokeWidth="1.2"
            />
          ) : (
            <path
              d={`M${x(p.x)},${y(p.y) - (data.length > 40 ? 5 : 7)} l${data.length > 40 ? 5 : 7},${data.length > 40 ? 9 : 12} h-${data.length > 40 ? 10 : 14} Z`}
              fill="#c7743c"
              stroke="white"
              strokeWidth="1"
            />
          )}
        </g>
      ))}
      {query && (
        <g>
          <circle
            cx={x(query.x)}
            cy={y(query.y)}
            r="10"
            fill="white"
            stroke="#1d3530"
            strokeWidth="2.5"
          />
          <path
            d={`M${x(query.x) - 5},${y(query.y)}h10 M${x(query.x)},${y(query.y) - 5}v10`}
            stroke="#1d3530"
            strokeWidth="1.5"
          />
        </g>
      )}
      <text x="244" y="369" textAnchor="middle" className="axis-label">
        Temperature →
      </text>
      <text
        transform="translate(15,182) rotate(-90)"
        textAnchor="middle"
        className="axis-label"
      >
        Vibration →
      </text>
    </svg>
  );
}
export function TreeDiagram({
  tree,
  expanded,
  query,
}: {
  tree: Tree;
  expanded?: Set<number>;
  query?: Point;
}) {
  const layout = useMemo(() => {
    let leaves = 0;
    const nodes: { node: Tree; x: number; y: number; parent?: number }[] = [];
    function walk(node: Tree, parent?: number): number {
      let x: number;
      if (node.split && (!expanded || expanded.has(node.id)))
        x = (walk(node.left!, node.id) + walk(node.right!, node.id)) / 2;
      else x = 88 + leaves++ * 168;
      nodes.push({ node, x, y: 38 + node.depth * 105, parent });
      return x;
    }
    walk(tree);
    return {
      nodes,
      width: Math.max(340, leaves * 168 + 8),
      height: Math.max(...nodes.map((n) => n.y)) + 61,
    };
  }, [tree, expanded]);
  const route = new Set<number>();
  if (query) {
    let n = tree;
    route.add(n.id);
    while (n.split && (!expanded || expanded.has(n.id))) {
      n =
        (n.split.feature === 0 ? query.x : query.y) <= n.split.threshold
          ? n.left!
          : n.right!;
      route.add(n.id);
    }
  }
  return (
    <div className="tree-scroll">
      <svg
        className="tree-diagram"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Decision tree. Each branch routes values at or below the threshold left; greater values right."
      >
        {layout.nodes
          .filter((n) => n.parent !== undefined)
          .map((n) => {
            const p = layout.nodes.find((v) => v.node.id === n.parent)!;
            return (
              <g key={`edge${n.node.id}`}>
                <path
                  d={`M${p.x},${p.y + 28} V${p.y + 51} H${n.x} V${n.y - 26}`}
                  fill="none"
                  stroke={route.has(n.node.id) ? "#256952" : "#bac8bb"}
                  strokeWidth={route.has(n.node.id) ? 2.5 : 1.5}
                />
                <text
                  x={n.x + (n.x < p.x ? -8 : 8)}
                  y={p.y + 69}
                  textAnchor={n.x < p.x ? "end" : "start"}
                >
                  {n.x < p.x ? "≤ yes" : "> no"}
                </text>
              </g>
            );
          })}
        {layout.nodes.map(({ node, x, y }) => {
          const internal = node.split && (!expanded || expanded.has(node.id));
          return (
            <g key={node.id}>
              <rect
                x={x - 74}
                y={y - 25}
                width="148"
                height="54"
                rx="8"
                fill={
                  internal ? "#fffefa" : node.prediction ? "#f8e4d4" : "#e2eddf"
                }
                stroke={route.has(node.id) ? "#256952" : "#c9d2c3"}
                strokeWidth={route.has(node.id) ? 2.5 : 1}
              />
              <text x={x} y={y - 4} textAnchor="middle" className="node-main">
                {internal
                  ? `${featureNames[node.split!.feature]} ≤ ${node.split!.threshold.toFixed(2)}`
                  : node.prediction
                    ? "△ Alert"
                    : "○ Normal"}
              </text>
              <text x={x} y={y + 15} textAnchor="middle">
                {node.samples.length} samples · p₁ {node.probability.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function Curve({
  rows,
  selected,
}: {
  rows: { depth: number; train: number; validation: number }[];
  selected: number;
}) {
  const x = (d: number) => 48 + (d - 1) * 54,
    y = (v: number) => 242 - v * 204;
  return (
    <svg
      viewBox="0 0 465 285"
      className="curve"
      role="img"
      aria-label="Accuracy versus maximum depth. Green is training; orange is validation."
    >
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1="48" x2="426" y1={y(v)} y2={y(v)} stroke="#e2e4d9" />
          <text x="36" y={y(v) + 4} textAnchor="end">
            {v * 100}%
          </text>
        </g>
      ))}
      <line
        x1={x(selected)}
        x2={x(selected)}
        y1="32"
        y2="242"
        stroke="#566e5c"
        strokeDasharray="5 5"
      />
      {(["train", "validation"] as const).map((key, k) => (
        <g key={key}>
          <polyline
            points={rows.map((r) => `${x(r.depth)},${y(r[key])}`).join(" ")}
            fill="none"
            stroke={k ? "#c7743c" : "#337f6a"}
            strokeWidth="2.5"
          />
          {rows.map((r) => (
            <circle
              key={r.depth}
              cx={x(r.depth)}
              cy={y(r[key])}
              r="4"
              fill={k ? "#c7743c" : "#337f6a"}
            >
              <title>{`Depth ${r.depth}: ${key} ${(r[key] * 100).toFixed(1)}%`}</title>
            </circle>
          ))}
        </g>
      ))}
      {rows.map((r) => (
        <text key={r.depth} x={x(r.depth)} y="261" textAnchor="middle">
          {r.depth}
        </text>
      ))}
      <text x="240" y="282" textAnchor="middle">
        Maximum depth
      </text>
    </svg>
  );
}
