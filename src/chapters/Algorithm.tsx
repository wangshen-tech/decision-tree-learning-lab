import { Callout, Code, Section } from "../components/UI";
import { GrowLab } from "../visualizations/Labs";
const steps = [
  {
    n: "01",
    title: "Collect the rows at this node",
    input:
      "Feature matrix X of shape (n, d), labels y of shape (n,), and current depth.",
    action:
      "Count each class and compute impurity. Store the majority prediction before trying a split.",
    output: "A node that can already act as a leaf.",
    why: "Every recursive branch needs a fallback when growth stops.",
    code: "node = Node(float(y.mean()), len(y), impurity(y), depth)",
  },
  {
    n: "02",
    title: "Check whether growth should stop",
    input: "Node impurity, sample count, maximum depth, and minimum leaf size.",
    action:
      "Stop if the node is pure, depth is exhausted, or there are too few rows to form two valid leaves.",
    output: "Either a finished leaf or permission to search.",
    why: "This prevents unnecessary computation and constrains model complexity.",
    code: "if depth >= max_depth or node.impurity == 0 or len(y) < 2 * min_leaf:\n    return node",
  },
  {
    n: "03",
    title: "Enumerate candidate questions",
    input: "The feature values among the current rows.",
    action:
      "Sort distinct values per feature. Test the midpoint between each adjacent pair. Reject candidates with an undersized child.",
    output: "A set of valid (feature, threshold) questions.",
    why: "Moving a threshold between two neighboring observed values does not change their partition. One midpoint represents that interval.",
    code: "values = np.unique(X[:, feature])\nthresholds = (values[:-1] + values[1:]) / 2",
  },
  {
    n: "04",
    title: "Keep the largest impurity reduction",
    input: "Every candidate partition and the parent impurity.",
    action:
      "Compute weighted child impurity. Save the question with the largest positive reduction.",
    output: "The best local split, or no split when none improves impurity.",
    why: "The greedy criterion favors children whose labels are less mixed. This teaching implementation stops on zero gain, so it cannot discover a pure XOR pattern that requires a zero-gain first split.",
    code: "gain = parent - weighted_children\nif gain > best_gain:\n    best = (feature, threshold, left_mask, gain)",
  },
  {
    n: "05",
    title: "Recurse, then predict by routing",
    input: "The selected split and its two subsets.",
    action:
      "Grow a tree independently for each subset. Later, route a new row through the stored tests until it reaches a leaf.",
    output: "A fitted tree; each new row gets a class and leaf proportions.",
    why: "Recursion learns conditional rules. Prediction only needs one root-to-leaf path.",
    code: "node.left = grow(X[left], y[left], depth + 1)\nnode.right = grow(X[~left], y[~left], depth + 1)",
  },
];
export default function Algorithm() {
  return (
    <>
      <Section
        eyebrow="MAKE THE RECURSION VISIBLE"
        title="From one leaf to a learned hierarchy."
      >
        <p>
          Use the same twelve observations as before. Each click performs one
          real split from a tree trained with Gini and maximum depth 3. Depth
          counts edges from the root: the root is depth 0.
        </p>
      </Section>
      <GrowLab />
      <Section title="The algorithm, with its inputs and outputs">
        <div className="algorithm-steps">
          {steps.map((s) => (
            <article key={s.n}>
              <span className="step-number">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <dl>
                  <dt>Input</dt>
                  <dd>{s.input}</dd>
                  <dt>Compute</dt>
                  <dd>{s.action}</dd>
                  <dt>Output</dt>
                  <dd>{s.output}</dd>
                  <dt>Reason</dt>
                  <dd>{s.why}</dd>
                </dl>
                <Code title={`Step ${s.n} · core operation`} code={s.code} />
              </div>
            </article>
          ))}
        </div>
      </Section>
      <Section title="What does it cost?">
        <p>
          Prediction is O(h) comparisons per row, where h is the reached leaf’s
          depth. A balanced tree has short paths, but a skewed tree can have
          much longer ones.
        </p>
        <p>
          Our simple implementation reevaluates masks for every threshold. At a
          node with n rows and d features, that costs roughly O(dn²), plus
          sorting. Across a balanced tree this is roughly O(dN²); a highly
          unbalanced tree can approach O(dN³). Production implementations sort
          and reuse statistics to avoid this repeated work. This clarity-first
          version is for hundreds of rows, not millions.
        </p>
        <Callout title="Deterministic does not mean identical across libraries">
          We visit features and thresholds in a fixed order and keep the first
          exact maximum. scikit-learn may select a different tied split, uses
          different numeric precision, and may allow zero-gain splits. Similar
          performance is expected; identical tree structure is not promised.
        </Callout>
      </Section>
    </>
  );
}
