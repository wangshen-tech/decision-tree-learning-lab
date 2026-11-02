import {
  ArrowDownRight,
  ArrowRight,
  Braces,
  GitBranch,
  SlidersHorizontal,
} from "lucide-react";
import { Callout, Section, Legend } from "../components/UI";
import { Scatter, TreeDiagram } from "../visualizations/Charts";
import { demoData, train } from "../lib/tree";
const tree = train(demoData, { maxDepth: 2, minLeaf: 1, criterion: "gini" });

export default function Introduction() {
  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> A HANDS-ON FIELD GUIDE
          </div>
          <h1>
            Big decisions.
            <br />
            <em>Small questions.</em>
          </h1>
          <p className="hero-description">
            Understand decision trees by building one. Turn a cloud of data into
            a sequence of simple, explainable choices.
          </p>
          <div className="button-row">
            <a href="#intuition" className="button primary">
              Explore the first split <ArrowRight size={17} />
            </a>
            <a href="#project" className="quiet-link">
              Jump to the project <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="hero-meta">
            <span>7 chapters</span>
            <span>3 live labs</span>
            <span>Python + NumPy</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-label">
            <span>FROM POINTS TO RULES</span>
            <span>FIG. 01</span>
          </div>
          <Scatter data={demoData} tree={tree} small />
          <div className="hero-rule">
            <GitBranch size={18} />
            <span>Ask. Split. Repeat.</span>
            <span>→</span>
          </div>
          <Legend />
        </div>
      </div>
      <div className="chapter-ribbon">
        <span>01 / INTRODUCTION</span>
        <span>Start with the question, then learn the machinery.</span>
      </div>
      <Section title="A model you can follow, one question at a time.">
        <p>
          A decision tree learns a sequence of{" "}
          <strong>if–then questions</strong> from labeled examples. Each
          internal node tests a feature. Each branch selects a subset of
          examples. Each leaf returns a prediction. Training chooses the
          questions; inference follows the learned path.
        </p>
        <p>
          Imagine a fictional machine with two readings: temperature and
          vibration. We want to predict whether it should raise an alert. A tree
          might ask “Is vibration above 7.5?” and, for the remaining readings,
          “Is temperature above 5.5?” The model discovers thresholds from data;
          it is not given those rules.
        </p>
        <div className="io-strip">
          <div>
            <small>INPUT · FEATURES</small>
            <strong>[temperature, vibration]</strong>
            <code>[8.0, 6.0]</code>
          </div>
          <ArrowRight />
          <div>
            <small>MODEL · LEARNED RULES</small>
            <strong>Follow a path through the tree</strong>
            <span>Numeric comparisons</span>
          </div>
          <ArrowRight />
          <div>
            <small>OUTPUT · PREDICTION</small>
            <strong>Normal or alert</strong>
            <span>Plus a leaf class proportion</span>
          </div>
        </div>
        <Callout title="What is actually learned?">
          The feature and threshold at every split, the tree structure, and the
          class counts in every leaf. You supply training examples and
          constraints such as maximum depth.
        </Callout>
      </Section>
      <Section title="Why use a tree?">
        <div className="three-columns">
          <div>
            <GitBranch />
            <h3>Readable decisions</h3>
            <p>
              A shallow tree gives a concrete explanation: this input passed
              these tests and reached this leaf.
            </p>
          </div>
          <div>
            <SlidersHorizontal />
            <h3>Flexible boundaries</h3>
            <p>
              Repeated splits describe nonlinear interactions. A high
              temperature might matter only when vibration is also high.
            </p>
          </div>
          <div>
            <Braces />
            <h3>A practical baseline</h3>
            <p>
              Trees work with numeric tabular features without standardization.
              Start with a small tree before adding more complexity.
            </p>
          </div>
        </div>
        <p>
          In an industrial workflow, a tree can flag sensor anomalies for
          inspection, route support tickets using encoded features, or estimate
          a numeric quantity with a regression tree. Data preparation,
          validation, monitoring, and human review still matter. A single deep
          tree can be unstable and overfit; random forests and boosted trees
          build on this same splitting idea.
        </p>
      </Section>
      <Section title="Your learning route">
        <div className="route-map">
          {[
            [
              "02",
              "See the split",
              "Move a threshold and measure how much it helps.",
              "intuition",
            ],
            [
              "03–04",
              "Open the algorithm",
              "Connect impurity, greedy search, and recursion.",
              "theory",
            ],
            [
              "05–06",
              "Build it in Python",
              "Train, evaluate, and understand every core function.",
              "project",
            ],
            [
              "07",
              "Make it stick",
              "Check your intuition and prepare for interviews.",
              "review",
            ],
          ].map(([n, title, text, id]) => (
            <a key={n} href={`#${id}`}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowRight size={19} />
            </a>
          ))}
        </div>
        <p className="small-copy">
          Prerequisites: Python, arrays, basic algebra, and probability. No
          prior machine-learning course required. All browser interactions run
          in TypeScript; the downloadable Python project runs locally on your
          CPU.
        </p>
      </Section>
    </>
  );
}
