import { useMemo, useState } from "react";
import { ArrowRight, Play, RotateCcw, Sparkles } from "lucide-react";
import {
  accuracy,
  candidates,
  confusion,
  demoData,
  evaluateSplit,
  featureNames,
  flatten,
  impurity,
  makeData,
  partition,
  percent,
  predict,
  train,
  type Criterion,
  type Point,
} from "../lib/tree";
import { Callout, Code, Legend, Range, Stat } from "../components/UI";
import { Curve, Scatter, TreeDiagram } from "./Charts";

export function SplitLab() {
  const [feature, setFeature] = useState<0 | 1>(0),
    [threshold, setThreshold] = useState(5);
  const [criterion, setCriterion] = useState<Criterion>("gini");
  const split = evaluateSplit(demoData, feature, threshold, criterion);
  const ranked = candidates(demoData, criterion);
  const best = ranked[0];
  return (
    <div className="lab" data-testid="split-lab">
      <div className="lab-header">
        <div>
          <span className="live-dot" /> INTERACTIVE 01{" "}
          <h3>One question. Two groups.</h3>
        </div>
        <span className="tag">12 training samples</span>
      </div>
      <div className="lab-grid">
        <div className="plot-pane">
          <Legend />
          <Scatter data={demoData} split={split} />
          <p className="figure-caption">
            Every point is an observation. Move the threshold and watch the
            class mixture change.
          </p>
        </div>
        <div className="controls">
          <label className="field">
            Split feature
            <select
              value={feature}
              onChange={(e) => setFeature(Number(e.target.value) as 0 | 1)}
            >
              <option value="0">Temperature</option>
              <option value="1">Vibration</option>
            </select>
          </label>
          <Range
            label="Threshold"
            value={threshold}
            onChange={setThreshold}
            min={0.5}
            max={9.5}
            step={0.01}
          />
          <label className="field">
            Impurity criterion
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value as Criterion)}
            >
              <option value="gini">Gini impurity</option>
              <option value="entropy">Entropy (bits)</option>
            </select>
          </label>
          <button
            className="button primary"
            onClick={() => {
              setFeature(best.feature);
              setThreshold(best.threshold);
            }}
          >
            <Sparkles size={16} /> Find the best split
          </button>
          <div className="rule">
            {featureNames[feature]} ≤ {threshold.toFixed(2)}?
          </div>
          <div className="child-stats">
            {[split.left, split.right].map((rows, i) => (
              <div key={i}>
                <small>{i === 0 ? "YES · LEFT" : "NO · RIGHT"}</small>
                <b>{rows.length} samples</b>
                <span>
                  {rows.filter((p) => !p.label).length} normal /{" "}
                  {rows.filter((p) => p.label).length} alert
                </span>
                <span>Impurity {impurity(rows, criterion).toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="stats-row" aria-live="polite">
        <Stat
          label="Parent impurity"
          value={impurity(demoData, criterion).toFixed(3)}
        />
        <Stat
          label="Weighted child impurity"
          value={split.weighted.toFixed(3)}
        />
        <Stat label="Impurity reduction" value={split.gain.toFixed(3)} />
      </div>
      <details className="candidate-details">
        <summary>Inspect the 5 best candidate splits</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Threshold</th>
                <th>Left / right</th>
                <th>Reduction</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 5).map((s, i) => (
                <tr key={i}>
                  <td>{featureNames[s.feature]}</td>
                  <td>{s.threshold.toFixed(2)}</td>
                  <td>
                    {s.left.length} / {s.right.length}
                  </td>
                  <td>{s.gain.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The search tests midpoints between distinct observed values on both
          features. Empty children are invalid.
        </p>
      </details>
    </div>
  );
}

export function GrowLab() {
  const tree = useMemo(
    () => train(demoData, { maxDepth: 3, minLeaf: 1, criterion: "gini" }),
    [],
  );
  const splits = flatten(tree).filter((n) => n.split);
  const [step, setStep] = useState(0);
  const expanded = useMemo(
    () => new Set(splits.slice(0, step).map((n) => n.id)),
    [step],
  );
  const current = step > 0 ? splits[step - 1] : undefined;
  return (
    <div className="lab">
      <div className="lab-header">
        <div>
          <span className="live-dot" /> INTERACTIVE 02
          <h3>Grow the tree, one split at a time.</h3>
        </div>
        <span className="tag">
          {step} / {splits.length} splits
        </span>
      </div>
      <div className="grow-grid">
        <div>
          <Scatter data={demoData} tree={tree} expanded={expanded} />
          <Legend />
        </div>
        <div className="growth-readout">
          <span className="eyebrow">
            {step === 0
              ? "START AT THE ROOT"
              : `SPLIT ${step} · DEPTH ${current!.depth}`}
          </span>
          <h4>
            {current
              ? `${featureNames[current.split!.feature]} ≤ ${current.split!.threshold.toFixed(2)}`
              : "All observations, one leaf."}
          </h4>
          <p>
            {current
              ? `Input: ${current.samples.length} samples. Compare all valid feature–threshold pairs. The best split sends ${current.split!.left.length} samples left and ${current.split!.right.length} right, reducing Gini by ${current.split!.gain.toFixed(3)}.`
              : "Before asking a question, predict the majority class for every observation. There are 6 normal and 6 alert samples, so our tie rule chooses normal."}
          </p>
          <p>
            {step === splits.length
              ? "Growth stops: each leaf is pure or has reached the depth limit. Trace the same rules in the diagram below."
              : "Next, split the next eligible node in depth-first order. A descendant only receives the rows routed to it."}
          </p>
          <div className="button-row">
            <button
              className="button primary"
              disabled={step === splits.length}
              onClick={() => setStep((v) => v + 1)}
            >
              <Play size={15} /> Next split
            </button>
            <button className="button secondary" onClick={() => setStep(0)}>
              <RotateCcw size={15} /> Reset
            </button>
          </div>
          <div className="inline-metric">
            Current training accuracy{" "}
            <strong>{percent(accuracy(tree, demoData, expanded))}</strong>
          </div>
        </div>
      </div>
      <TreeDiagram tree={tree} expanded={expanded} />
      <p className="figure-caption">
        The shaded regions and tree use exactly the same expanded nodes. A
        frontier node predicts its majority class.
      </p>
    </div>
  );
}

export function ExperimentLab() {
  const [depth, setDepth] = useState(3),
    [minLeaf, setMinLeaf] = useState(3),
    [noise, setNoise] = useState(0.08);
  const [criterion, setCriterion] = useState<Criterion>("gini"),
    [seed, setSeed] = useState(42);
  const [showValidation, setShowValidation] = useState(true);
  const [query, setQuery] = useState<Point>({ x: 8, y: 6, label: 0, id: -1 });
  const data = useMemo(() => partition(makeData(seed, noise)), [seed, noise]);
  const experiments = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const tree = train(data.train, { maxDepth: i + 1, minLeaf, criterion });
        return {
          depth: i + 1,
          tree,
          train: accuracy(tree, data.train),
          validation: accuracy(tree, data.validation),
        };
      }),
    [data, minLeaf, criterion],
  );
  const result = experiments[depth - 1],
    tree = result.tree;
  const matrix = confusion(tree, data.validation),
    leaf = predict(tree, query);
  const route: string[] = [];
  let node = tree;
  while (node.split) {
    const v = node.split.feature === 0 ? query.x : query.y;
    const yes = v <= node.split.threshold;
    route.push(
      `${featureNames[node.split.feature]} ${v.toFixed(2)} ${yes ? "≤" : ">"} ${node.split.threshold.toFixed(2)} → ${yes ? "left" : "right"}`,
    );
    node = yes ? node.left! : node.right!;
  }
  const recommended = experiments.reduce(
    (best, row) => (row.validation > best.validation ? row : best),
    experiments[0],
  );
  return (
    <div className="lab" data-testid="experiment-lab">
      <div className="lab-header">
        <div>
          <span className="live-dot" /> INTERACTIVE 03
          <h3>The depth of a decision.</h3>
        </div>
        <span className="tag">Computed in your browser</span>
      </div>
      <div className="lab-grid">
        <div className="plot-pane">
          <div className="plot-toolbar">
            <Legend />
            <label>
              <input
                type="checkbox"
                checked={showValidation}
                onChange={(e) => setShowValidation(e.target.checked)}
              />{" "}
              Validation points
            </label>
          </div>
          <Scatter
            data={showValidation ? data.validation : data.train}
            tree={tree}
            query={query}
            onQuery={setQuery}
          />
          <p className="figure-caption">
            Click the plot to predict a new point, or use the coordinate sliders
            below. Background colors are the learned decision regions.
          </p>
        </div>
        <div className="controls">
          <Range
            label="Maximum depth"
            value={depth}
            onChange={setDepth}
            min={1}
            max={8}
          />
          <Range
            label="Minimum samples per leaf"
            value={minLeaf}
            onChange={setMinLeaf}
            min={1}
            max={20}
          />
          <Range
            label="Label-flip probability"
            value={noise}
            onChange={setNoise}
            min={0}
            max={0.3}
            step={0.01}
          />
          <label className="field">
            Criterion
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value as Criterion)}
            >
              <option value="gini">Gini</option>
              <option value="entropy">Entropy</option>
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() => setSeed((v) => v + 1)}
          >
            New dataset <ArrowRight size={15} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              setDepth(3);
              setMinLeaf(3);
              setNoise(0.08);
              setCriterion("gini");
              setSeed(42);
              setQuery({ x: 8, y: 6, label: 0, id: -1 });
              setShowValidation(true);
            }}
          >
            Reset experiment
          </button>
          <small>
            Seed {seed} · 144 train / 48 validation
            <br />
            48 test observations are reserved for Python evaluation.
          </small>
        </div>
      </div>
      <div className="stats-row" aria-live="polite">
        <Stat label="Training accuracy" value={percent(result.train)} />
        <Stat label="Validation accuracy" value={percent(result.validation)} />
        <Stat
          label="Leaves"
          value={flatten(tree).filter((n) => !n.split).length}
        />
      </div>
      <div className="experiment-analysis">
        <div>
          <h4>When does complexity stop helping?</h4>
          <div className="legend">
            <span>
              <i className="normal" /> Training
            </span>
            <span>
              <i className="alert" /> Validation
            </span>
          </div>
          <Curve rows={experiments} selected={depth} />
          <p className="figure-caption">
            All 8 trees are trained again when data, criterion, or minimum leaf
            size changes. Best validation depth: <b>{recommended.depth}</b>{" "}
            (shallower wins ties).
          </p>
          <details>
            <summary>Show exact experiment values</summary>
            <table>
              <thead>
                <tr>
                  <th>Depth</th>
                  <th>Training</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((r) => (
                  <tr key={r.depth}>
                    <td>{r.depth}</td>
                    <td>{percent(r.train)}</td>
                    <td>{percent(r.validation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
        <div>
          <h4>Read the mistakes</h4>
          <p className="small-copy">
            Validation confusion matrix. Rows = actual, columns = predicted.
          </p>
          <div className="matrix">
            <span />
            <small>Normal</small>
            <small>Alert</small>
            <small>Normal</small>
            <b>
              {matrix[0][0]}
              <small>true negatives</small>
            </b>
            <b className="error">
              {matrix[0][1]}
              <small>false positives</small>
            </b>
            <small>Alert</small>
            <b className="error">
              {matrix[1][0]}
              <small>false negatives</small>
            </b>
            <b>
              {matrix[1][1]}
              <small>true positives</small>
            </b>
          </div>
          <p className="small-copy">
            Changing depth can improve training fit without improving
            unseen-data performance. A single validation split is noisy; repeat
            across seeds to check stability.
          </p>
        </div>
      </div>
      <div className="prediction-panel">
        <div>
          <span className="eyebrow">FOLLOW ONE PREDICTION</span>
          <h4>
            {leaf.prediction ? "△ Alert" : "○ Normal"}{" "}
            <span className="muted">
              · p(alert) = {leaf.probability.toFixed(3)}
            </span>
          </h4>
          <p>
            This is the alert fraction among {leaf.samples.length} training
            samples in the reached leaf. It is not a calibrated guarantee.
          </p>
          <ol className="route">
            {route.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            <li>Leaf → {leaf.prediction ? "alert" : "normal"}</li>
          </ol>
        </div>
        <div>
          <Range
            label="Query temperature"
            value={query.x}
            onChange={(v) => setQuery({ ...query, x: v })}
            min={0}
            max={10}
            step={0.01}
          />
          <Range
            label="Query vibration"
            value={query.y}
            onChange={(v) => setQuery({ ...query, y: v })}
            min={0}
            max={10}
            step={0.01}
          />
        </div>
      </div>
      <details>
        <summary>
          Inspect the fitted tree and highlighted prediction path
        </summary>
        <TreeDiagram tree={tree} query={query} />
      </details>
    </div>
  );
}
