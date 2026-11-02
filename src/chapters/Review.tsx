import { useState } from "react";
import { Callout, Section } from "../components/UI";
const questions = [
  [
    "How does a decision tree choose a split?",
    "At each node it evaluates candidate feature–threshold pairs and chooses the greatest sample-weighted impurity reduction subject to constraints. Gini and entropy are common classification criteria. The search is greedy, so it does not guarantee a globally optimal tree.",
  ],
  [
    "Why do deep trees overfit, and how can you control it?",
    "Deep trees can carve small regions around noise or unusual training examples. Limit maximum depth, increase minimum samples per leaf, or use cost-complexity pruning. Select these settings on validation data or by cross-validation, then evaluate once on the held-out test set.",
  ],
  [
    "Do decision trees need feature scaling?",
    "Ordinary axis-aligned trees compare ordering within one feature at a time, so standardization is generally unnecessary. Finite precision, transformed ties, and implementation details can affect exact results. You still need appropriate handling of categorical and missing data.",
  ],
  [
    "How do classification and regression trees differ?",
    "Both recursively partition feature space. Classification uses a criterion such as Gini or entropy and predicts a majority class with leaf proportions. Squared-error regression uses weighted within-node squared deviations and predicts the mean target in each leaf.",
  ],
  [
    "What are a single tree’s main limitations?",
    "Small changes in training data can change the first split and the entire subtree. Deep trees have high variance, greedy growth can miss better structures, axis-aligned cuts may be inefficient for diagonal boundaries, and small-leaf probabilities are poorly calibrated. Ensembles often improve stability or predictive performance but are harder to interpret.",
  ],
];
const quiz = [
  {
    q: "A split creates one pure sample and leaves 99 highly mixed samples. What determines whether it is useful?",
    options: [
      "The purity of the smallest child",
      "The sample-weighted reduction across both children",
      "Whether the tree looks balanced",
    ],
    answer: 1,
    why: "Every observation counts. Weight each child’s impurity by its fraction of the parent, then compare with the parent impurity.",
  },
  {
    q: "Training accuracy rises with depth, while validation accuracy falls. What should you do?",
    options: [
      "Choose the deepest tree",
      "Inspect the test set until you find a better depth",
      "Choose complexity using validation, and keep test data held out",
    ],
    answer: 2,
    why: "That pattern suggests overfitting. Use validation or cross-validation to select complexity; preserve a final independent estimate.",
  },
  {
    q: "A leaf has 8 normal and 2 alert training rows. What is p(alert) in this implementation?",
    options: ["0.2", "0.8", "1.0 because alerts are important"],
    answer: 0,
    why: "The estimate is the observed alert fraction, 2/10. Changing the decision cost or threshold is a separate modeling choice.",
  },
];
export default function Review() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <>
      <Section
        eyebrow="TAKE THE IDEA WITH YOU"
        title="If you remember eight things…"
      >
        <ol className="recap-list">
          {[
            "A tree learns questions from labeled training examples; inference follows one path.",
            "A split tests one feature and sends values ≤ the threshold left.",
            "Gini and entropy measure class mixture, not accuracy.",
            "Score a split using sample-weighted child impurity, not an unweighted average.",
            "Recursive growth is greedy; locally best is not globally optimal.",
            "Leaves predict a majority class and empirical class proportions.",
            "Depth, minimum leaf size, and pruning control complexity; use validation to select them.",
            "A final held-out test and an error breakdown matter more than perfect training accuracy.",
          ].map((t, i) => (
            <li key={t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {t}
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Check your intuition">
        <div className="quiz">
          {quiz.map((item, i) => (
            <article key={item.q}>
              <h3>
                {i + 1}. {item.q}
              </h3>
              <div className="quiz-options">
                {item.options.map((option, j) => (
                  <button
                    key={option}
                    className={
                      answers[i] === j
                        ? j === item.answer
                          ? "correct"
                          : "incorrect"
                        : ""
                    }
                    aria-pressed={answers[i] === j}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                  >
                    {String.fromCharCode(65 + j)}
                    <span>{option}</span>
                  </button>
                ))}
              </div>
              {answers[i] !== undefined && (
                <p className="quiz-feedback" role="status">
                  <b>
                    {answers[i] === item.answer ? "Correct. " : "Try again. "}
                  </b>
                  {item.why}
                </p>
              )}
            </article>
          ))}
        </div>
      </Section>
      <Section title="Five interview questions">
        <div className="accordions">
          {questions.map(([q, a], i) => (
            <details key={q}>
              <summary>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {q}
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </Section>
      <Section title="Common traps, corrected">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Misconception</th>
                <th>Better understanding</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>“A pure tree is a good tree.”</td>
                <td>
                  Pure training leaves can memorize noise. Measure
                  generalization.
                </td>
              </tr>
              <tr>
                <td>“A probability of 1 means certainty.”</td>
                <td>
                  It means every training row in that leaf had the same class.
                  Calibration and sample count still matter.
                </td>
              </tr>
              <tr>
                <td>“Trees accept every raw data type automatically.”</td>
                <td>
                  This model requires finite numeric features. Categorical and
                  missing-value support depends on the implementation.
                </td>
              </tr>
              <tr>
                <td>“Feature importance proves causation.”</td>
                <td>
                  Impurity importance reflects the fitted prediction structure;
                  it can favor high-cardinality features and spread credit
                  across correlated ones.
                </td>
              </tr>
              <tr>
                <td>“Higher depth must improve validation accuracy.”</td>
                <td>
                  More capacity can fit noise. Our experiment demonstrates a
                  validation peak and later decline.
                </td>
              </tr>
              <tr>
                <td>
                  “My model should recover the hidden generating thresholds
                  exactly.”
                </td>
                <td>
                  Finite, noisy samples and greedy search need not recover those
                  exact rules.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Three projects to try next">
        <div className="next-projects">
          <article>
            <span>01</span>
            <h3>Prune, then compare</h3>
            <p>
              Use scikit-learn’s cost-complexity path. Select α with
              cross-validation on the development data. Plot leaf count versus
              validation score.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Predict a continuous value</h3>
            <p>
              Replace labels with a noisy sensor output. Implement
              mean-squared-error splitting and leaf means. Evaluate MAE and
              RMSE.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Build a small forest</h3>
            <p>
              Train trees on bootstrap samples and random feature subsets.
              Average their probabilities. Compare stability across seeds with a
              single tree.
            </p>
          </article>
        </div>
      </Section>
      <Section title="Go back to the primary sources">
        <ul className="source-list">
          <li>
            <a
              href="https://scikit-learn.org/stable/modules/tree.html"
              target="_blank"
              rel="noreferrer"
            >
              scikit-learn · Decision trees user guide ↗
            </a>
            <p>Mathematical formulation, practical limitations, and pruning.</p>
          </li>
          <li>
            <a
              href="https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html"
              target="_blank"
              rel="noreferrer"
            >
              DecisionTreeClassifier · API reference ↗
            </a>
            <p>Precise parameter meanings and behavior of the library model.</p>
          </li>
          <li>
            <a
              href="https://scikit-learn.org/stable/modules/model_evaluation.html"
              target="_blank"
              rel="noreferrer"
            >
              scikit-learn · Model evaluation ↗
            </a>
            <p>Classification metrics and their interpretation.</p>
          </li>
        </ul>
        <Callout title="You now have a complete learning loop">
          Explain a split, calculate its gain, implement it, test it, and
          challenge it with new data. Return to the experiment whenever a
          formula feels abstract.
        </Callout>
      </Section>
    </>
  );
}
