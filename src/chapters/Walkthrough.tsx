import { useState } from "react";
import { Callout, Code, Download, Section } from "../components/UI";
import source from "../../project/tree.py?raw";
import main from "../../project/main.py?raw";
import data from "../../project/data.py?raw";
function region(text: string, name: string) {
  return text
    .split(`# region ${name}\n`)[1]
    .split(`# endregion ${name}`)[0]
    .trimEnd();
}
const modules = [
  {
    id: "impurity",
    title: "01 · Measure impurity",
    code: region(source, "impurity"),
    notes: [
      [
        "criterion validation",
        "Reject unknown criteria instead of silently using a different formula.",
      ],
      [
        "len(y) == 0",
        "Return zero for the empty-set helper case. The splitter still forbids empty children.",
      ],
      [
        "np.bincount(y, minlength=2)",
        "Count class 0 and class 1, even when one class is absent. For y = [0, 0, 0, 1], counts are [3, 1].",
      ],
      [
        "p = counts / len(y)",
        "Produce a float array with shape (2,): [0.75, 0.25].",
      ],
      [
        "1 - np.sum(p ** 2)",
        "Apply the Gini formula directly: 0.375 for that example.",
      ],
      [
        "p[p > 0]",
        "Avoid log2(0); zero-probability classes contribute zero entropy.",
      ],
    ],
  },
  {
    id: "split",
    title: "02 · Search the splits",
    code: region(source, "split"),
    notes: [
      [
        "parent = impurity(y, criterion)",
        "Compute the reference uncertainty once for this node.",
      ],
      [
        "best_gain = 1e-12",
        "Require a meaningful positive improvement, avoiding floating-point noise near zero.",
      ],
      [
        "range(X.shape[1])",
        "Visit every feature. For our project, X has shape (n, 2).",
      ],
      [
        "np.unique(X[:, feature])",
        "Return sorted distinct values. For [1, 1, 2, 8], the result is [1, 2, 8].",
      ],
      [
        "thresholds = (values[:-1] + values[1:]) / 2",
        "Candidate thresholds are [1.5, 5.0]. Duplicate values cannot be separated by a numeric threshold.",
      ],
      [
        "left = X[:, feature] <= threshold",
        "A Boolean array of shape (n,). For [1, 2, 8] at threshold 5, it is [True, True, False]. ~left selects the complement.",
      ],
      [
        "min(n_left, n_right) < min_leaf",
        "Enforce the constraint on both children before scoring them.",
      ],
      [
        "weighted ... / len(y)",
        "Weight each child by its sample fraction, keeping all observations equally influential.",
      ],
      [
        "if gain > best_gain",
        "Store the best local question. Strict comparison retains the first exact tie. Return None if no positive valid split exists.",
      ],
    ],
  },
  {
    id: "grow",
    title: "03 · Grow recursively",
    code: region(source, "grow"),
    notes: [
      [
        "Node(float(y.mean()), ...)",
        "For binary 0/1 labels, the mean is p(alert). This node can already predict if growth stops.",
      ],
      [
        "depth >= self.max_depth",
        "Root depth is zero. max_depth=0 produces a single leaf in our implementation.",
      ],
      [
        "node.impurity == 0",
        "A pure node needs no further split to fit these labels.",
      ],
      [
        "len(y) < 2 * self.min_leaf",
        "There cannot be two children of the required minimum size.",
      ],
      [
        "split = best_split(...)",
        "This is the core learning operation. Only rows reaching the current node enter the search.",
      ],
      [
        "split is None",
        "Identical feature rows, zero gain, or leaf constraints can all prevent a split.",
      ],
      [
        "node.feature, node.threshold, node.gain = ...",
        "Store the rule so inference will not need to search thresholds again.",
      ],
      [
        "self._grow(X[left], y[left], depth + 1)",
        "Build each child on its own subset. Boolean indexing preserves the alignment of features and labels.",
      ],
    ],
  },
  {
    id: "predict",
    title: "04 · Route a new row",
    code: region(source, "predict"),
    notes: [
      [
        "self.root is None",
        "Catch prediction before fitting with an explicit error.",
      ],
      [
        "X.shape[1] != self.n_features",
        "Prevent incorrect feature counts. Feature order must match training.",
      ],
      [
        "for row in X",
        "One row has shape (2,). Predictions for m rows produce m outputs.",
      ],
      [
        "while node.feature is not None",
        "Internal nodes contain tests; a None feature identifies a leaf.",
      ],
      [
        "row[node.feature] <= node.threshold",
        "Use the identical comparison used during training, including equality going left.",
      ],
      [
        "[1 - node.probability, node.probability]",
        "Return probabilities ordered [normal, alert]. Output shape is (m, 2).",
      ],
      [
        "argmax(axis=1)",
        "Choose one class per row. NumPy returns the first maximum, so a tie selects normal.",
      ],
    ],
  },
];
export default function Walkthrough() {
  const [active, setActive] = useState(0),
    [file, setFile] = useState("tree.py");
  return (
    <>
      <Section
        eyebrow="READ THE CODE WITH A PURPOSE"
        title="Four functions. One working model."
      >
        <p>
          These snippets are extracted directly from the downloadable source
          during the website build. They are the actual implementation, not a
          separate illustrative version. Read the notes alongside each
          operation, then open the complete files below.
        </p>
        <div className="file-map">
          <code>data.py</code>
          <span>Generate rows + partition indices</span>
          <code>tree.py</code>
          <span>Impurity → split search → recursive growth → prediction</span>
          <code>main.py</code>
          <span>Train → select depth → evaluate → save figures</span>
          <code>test_tree.py</code>
          <span>
            Check formulas, boundaries, stopping rules, and input validation
          </span>
        </div>
      </Section>
      <div
        className="module-tabs"
        role="tablist"
        aria-label="Core Python modules"
      >
        {modules.map((m, i) => (
          <button
            key={m.id}
            id={`tab-${m.id}`}
            aria-controls="code-panel"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
          >
            {m.title}
          </button>
        ))}
      </div>
      <div
        id="code-panel"
        role="tabpanel"
        aria-labelledby={`tab-${modules[active].id}`}
      >
        <Code
          title={`tree.py · ${modules[active].id}`}
          code={modules[active].code}
        />
        <ol className="line-notes">
          {modules[active].notes.map(([line, note], i) => (
            <li key={line}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <code>{line}</code>
                <p>{note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <Section title="The complete source, with nothing omitted">
        <label className="field source-picker">
          File
          <select value={file} onChange={(e) => setFile(e.target.value)}>
            <option>tree.py</option>
            <option>data.py</option>
            <option>main.py</option>
          </select>
        </label>
        <details className="full-source">
          <summary>Read all of {file}</summary>
          <Code
            title={file}
            code={
              file === "tree.py" ? source : file === "data.py" ? data : main
            }
          />
        </details>
        <div className="button-row">
          <Download path="downloads/python-project.zip">
            Python source + reference output
          </Download>
          <Download path="downloads/decision-tree-lab-source.zip">
            Full website repository
          </Download>
        </div>
        <Callout title="Run where it says to run">
          The website executes the TypeScript implementation in your browser.
          The Python files run in a local Python environment. No button sends
          your code to a server, and GitHub Pages does not execute Python.
        </Callout>
      </Section>
    </>
  );
}
