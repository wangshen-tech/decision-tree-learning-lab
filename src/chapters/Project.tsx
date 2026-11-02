import {
  Callout,
  Code,
  Download,
  MathFormula,
  Section,
  Stat,
} from "../components/UI";
import { ExperimentLab } from "../visualizations/Labs";
import baseline from "../../project/reference/results.json";
import figure from "../../project/reference/experiment.png";
import { percent } from "../lib/tree";
export default function Project() {
  const m = baseline.scratch_test;
  return (
    <>
      <div className="project-banner">
        <span className="eyebrow">BUILD SOMETHING YOU CAN EXPLAIN</span>
        <h2>
          A small sensor.
          <br />A complete classifier.
        </h2>
        <p>
          240 observations. Two features. One decision tree, built from scratch
          and checked against scikit-learn.
        </p>
        <Download path="downloads/python-project.zip">
          Download the Python project
        </Download>
      </div>
      <Section
        eyebrow="STEP 1 · PROBLEM DEFINITION"
        title="Predict an alert from two readings"
      >
        <p>
          Our fictional sensor produces temperature and vibration readings on a
          dimensionless scale from 0 to 10. Label 0 means normal; label 1 means
          alert. We generate examples using a known hidden rule and
          independently flip each label with probability 0.08 to simulate
          imperfect measurements.
        </p>
        <Code
          title="data.py · the data-generating process"
          code={
            "label = int((temperature > 5.5 and vibration > 3) or vibration > 7.5)\nif next(random) < noise:\n    label = 1 - label"
          }
        />
        <p>
          The model receives only features and observed labels. It never sees
          the hidden rule. The expected output is a trained classifier, a
          depth-selection table, a held-out evaluation, and two figures. This is
          synthetic teaching data, not a validated equipment-monitoring system.
        </p>
      </Section>
      <Section
        eyebrow="STEP 2 · DATA PREPARATION"
        title="Split before you choose a model"
      >
        <Code
          title="Run locally · Python 3.11 or 3.12"
          language="bash"
          code={
            "cd project\npython3 -m venv .venv\nsource .venv/bin/activate\n# Windows PowerShell: .venv\\Scripts\\Activate.ps1\npython -m pip install -r requirements.txt\npython main.py\npython -m unittest discover -s . -v"
          }
        />
        <Code
          title="main.py · prepare disjoint partitions"
          code={
            "X, y = make_data(seed=42, noise=0.08)\ntrain, validation, test = split_indices(len(y))\nX_train, y_train = X[train], y[train]"
          }
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Type / shape</th>
                <th>Meaning / actual value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>X</td>
                <td>float64 · (240, 2)</td>
                <td>Temperature and vibration</td>
              </tr>
              <tr>
                <td>y</td>
                <td>integer · (240,)</td>
                <td>Binary observed labels</td>
              </tr>
              <tr>
                <td>X[0]</td>
                <td>float64 · (2,)</td>
                <td>
                  [{baseline.first_row.map((v) => v.toFixed(6)).join(", ")}]
                </td>
              </tr>
              <tr>
                <td>y[0]</td>
                <td>integer scalar</td>
                <td>{baseline.first_label}</td>
              </tr>
              <tr>
                <td>X_train</td>
                <td>float64 · (144, 2)</td>
                <td>60% for learning splits</td>
              </tr>
              <tr>
                <td>X_validation</td>
                <td>float64 · (48, 2)</td>
                <td>20% for choosing depth</td>
              </tr>
              <tr>
                <td>X_test</td>
                <td>float64 · (48, 2)</td>
                <td>20% for the final estimate</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          There are no missing values or categorical inputs, so no imputation or
          encoding is needed. Scaling is unnecessary for these threshold-based
          trees. The fixed shuffle is random but not stratified; for imbalanced
          or small real datasets, use a stratified split. Time-dependent sensor
          data usually needs a time-based evaluation instead.
        </p>
        <Callout title="The test set is not a tuning tool">
          Depth is selected using validation accuracy. Test labels are accessed
          only after that choice. Repeatedly tuning against the test score would
          turn it into another validation set.
        </Callout>
      </Section>
      <Section
        eyebrow="STEP 3 · MODEL IMPLEMENTATION"
        title="Build the core, then compare the library"
      >
        <p>
          Our <code>ScratchTree</code> stores class proportions, searches
          midpoint thresholds, grows two children recursively, and routes new
          rows. Its implementation lives in <code>project/tree.py</code>. The
          next chapter opens each function and explains its design.
        </p>
        <Code
          title="The two implementations"
          code={
            'scratch = ScratchTree(max_depth=3, min_leaf=3, criterion="gini")\nscratch.fit(X_train, y_train)\n\nlibrary = DecisionTreeClassifier(\n    max_depth=3, min_samples_leaf=3, criterion="gini", random_state=42\n)\nlibrary.fit(X_train, y_train)'
          }
        />
        <p>
          <code>min_leaf</code> is our name for the library’s{" "}
          <code>min_samples_leaf</code>. The same constraints make the
          comparison useful, but tie-breaking and zero-gain splits can differ.
        </p>
      </Section>
      <Section
        eyebrow="STEP 4 · TRAINING & INFERENCE"
        title="Select a depth, then freeze the choice"
      >
        <p>
          The complete script fits depths 1 through 8 on the 144 training rows.
          It chooses the highest validation accuracy, preferring the shallower
          tree on a tie, and keeps that fitted model without refitting. In the
          included reference run, the selected depth is{" "}
          <strong>{baseline.selected_depth}</strong>.
        </p>
        <Code
          title="main.py · selection uses validation only"
          code={
            "for depth in range(1, 9):\n    model = ScratchTree(depth, min_leaf, criterion).fit(X[train], y[train])\n    score = accuracy_score(y[validation], model.predict(X[validation]))\n    # store model and score; select the first highest validation score\n\nselected.predict([[8.0, 6.0]])\nselected.predict_proba([[8.0, 6.0]])"
          }
        />
        <div className="stats-row">
          <Stat
            label="Reference root threshold"
            value={baseline.root.threshold?.toFixed(4)}
            detail={baseline.root.feature === 0 ? "Temperature" : "Vibration"}
          />
          <Stat
            label="Root Gini reduction"
            value={baseline.root.gain.toFixed(4)}
          />
          <Stat
            label="Prediction at [8, 6]"
            value={baseline.sample_prediction.class ? "Alert" : "Normal"}
            detail={`p(alert) = ${baseline.sample_prediction.probability[1].toFixed(3)}`}
          />
        </div>
        <p className="small-copy">
          These reference values are imported from the JSON produced by actually
          running <code>main.py</code>, using seed 42, noise 0.08, minimum leaf
          size 3, and Gini. The interactive experiment below computes its own
          results live.
        </p>
      </Section>
      <Section
        eyebrow="STEP 5 · EVALUATION"
        title="Count the errors that matter"
      >
        <MathFormula>{String.raw`\text{accuracy}=\frac{TP+TN}{N},\quad\text{precision}=\frac{TP}{TP+FP},\quad\text{recall}=\frac{TP}{TP+FN}`}</MathFormula>
        <MathFormula>{String.raw`F_1=\frac{2TP}{2TP+FP+FN}`}</MathFormula>
        <p>
          <strong>Symbols:</strong> alert is the positive class. TP = correctly
          predicted alerts; TN = correctly predicted normals; FP = false alarms;
          FN = missed alerts. N is the evaluation count. Accuracy measures all
          correct decisions, precision measures how trustworthy predicted alerts
          are, recall measures how many actual alerts are detected, and F1
          balances precision and recall.
        </p>
        <p>
          <strong>Actual reference calculation:</strong> the test confusion
          matrix is [[{m.confusion_matrix[0].join(", ")}], [
          {m.confusion_matrix[1].join(", ")}]], with rows actual and columns
          predicted. Accuracy = ({m.confusion_matrix[0][0]} +{" "}
          {m.confusion_matrix[1][1]}) / 48 ={" "}
          <strong>{percent(m.accuracy)}</strong>; precision ={" "}
          {m.confusion_matrix[1][1]} / ({m.confusion_matrix[1][1]} +{" "}
          {m.confusion_matrix[0][1]}) = {percent(m.precision)}; recall ={" "}
          {m.confusion_matrix[1][1]} / ({m.confusion_matrix[1][1]} +{" "}
          {m.confusion_matrix[1][0]}) = {percent(m.recall)}; F1 ={" "}
          {m.f1.toFixed(4)}.
        </p>
        <Code
          title="main.py · metrics"
          code={
            "prediction = selected.predict(X[test])\naccuracy_score(y[test], prediction)\nconfusion_matrix(y[test], prediction, labels=[0, 1])\nprecision_score(y[test], prediction, zero_division=0)\nrecall_score(y[test], prediction, zero_division=0)\nf1_score(y[test], prediction, zero_division=0)"
          }
        />
        <p>
          Undefined precision or recall is reported as 0 in the script. Always
          inspect the class counts. The training-majority baseline scores{" "}
          {percent(baseline.majority_test_accuracy)} on this test set; the
          scikit-learn comparison scores{" "}
          {percent(baseline.sklearn_test.accuracy)}. A 48-row test set gives a
          noisy estimate, not a guarantee of future accuracy.
        </p>
        <img
          className="project-result"
          src={figure}
          alt="Python-generated reference plots: held-out decision regions, training and validation accuracy versus depth, and the test confusion matrix"
        />
        <p className="figure-caption">
          Actual saved output from the included Python run. Reproduce it with
          the default command.
        </p>
      </Section>
      <Section
        eyebrow="STEP 6 · EXPERIMENT"
        title="Change the tree. Observe the trade-off."
      >
        <p>
          Try depth 1, then 3, then 8. Reduce the minimum leaf size to 1 and
          increase label noise. The browser trains real trees and recomputes the
          plot, metrics, and prediction path. The reserved test partition is
          never used in these controls.
        </p>
      </Section>
      <ExperimentLab />
      <Section title="Reproduce the experiments locally">
        <Code
          title="From the project directory"
          language="bash"
          code={
            "python main.py --seed 42 --noise 0.08 --min-leaf 3 --criterion gini\npython main.py --noise 0.20 --min-leaf 1 --output output/noisy\npython main.py --criterion entropy --output output/entropy\npython main.py --seed 43 --output output/seed43"
          }
        />
        <p>
          Each run writes <code>results.json</code>,{" "}
          <code>sensor_data.csv</code> with its partition membership,{" "}
          <code>experiment.png</code>, and <code>sklearn_tree.png</code>. Every
          run sweeps all eight depths. Keep the seed and data fixed when
          comparing a model parameter so you change one thing at a time.
        </p>
      </Section>
      <Section
        eyebrow="STEP 7 · CONCLUSION"
        title="What this little project proves"
      >
        <p>
          You can build an understandable nonlinear classifier with just
          threshold comparisons, an impurity measure, and recursion. Complexity
          controls matter even on two features. The best training score need not
          give the best validation score.
        </p>
        <p>
          This example cannot establish real-world reliability. It has
          synthetic, independent rows, two numeric features, known label noise,
          and a tiny holdout. A production workflow needs representative labels,
          leakage checks, cost-sensitive evaluation, drift monitoring, and a
          maintained optimized implementation. Our tree also lacks sample
          weights, missing-value handling, categorical splits, and post-pruning.
        </p>
      </Section>
    </>
  );
}
