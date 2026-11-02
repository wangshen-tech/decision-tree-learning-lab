import { Callout, Section } from "../components/UI";
import { SplitLab } from "../visualizations/Labs";
export default function Intuition() {
  return (
    <>
      <Section
        eyebrow="THINK IN GROUPS"
        title="A useful question makes the answers less mixed."
      >
        <p>
          Start with twelve labeled observations: six normal and six alerts. If
          you had to predict without looking at the features, a single majority
          prediction would be correct only half the time. A good question
          separates the labels into purer groups.
        </p>
        <p>
          In this lab, <strong>yes always goes left</strong>: values at or below
          the threshold. “No” goes right. A vertical cut tests temperature; a
          horizontal cut tests vibration. These are axis-aligned splits: each
          question examines just one feature.
        </p>
      </Section>
      <SplitLab />
      <Section title="Try these three small experiments">
        <ol className="exercise-list">
          <li>
            <b>Start with temperature ≤ 5.</b> The left child has 5 normal and 1
            alert; the right has 1 normal and 5 alerts. Both are more useful
            than the original 50/50 mixture.
          </li>
          <li>
            <b>Move the threshold near the edge.</b> Isolating one observation
            can create a pure child while barely helping the rest. This is why
            the algorithm weights each child by its sample count.
          </li>
          <li>
            <b>Select “Find the best split.”</b> The algorithm evaluates both
            features, not just the selected one. Switch to entropy and compare
            rankings. The criteria need not always choose the same question.
          </li>
        </ol>
        <Callout title="Pure does not mean correct on future data.">
          A leaf can be perfectly pure by containing only one training example.
          Memorizing training labels is easy; making useful predictions on new
          observations is the real goal.
        </Callout>
      </Section>
      <Section title="A tree is a map of rectangular regions">
        <p>
          After the first split, repeat the search separately inside each child.
          The next question only changes the region that reaches that child.
          Repeated cuts tile the feature space into rectangles. Every point in
          one leaf receives the same predicted class and the same class
          probabilities.
        </p>
        <p>
          Training is <strong>greedy</strong>: it takes the best immediate
          improvement at the current node. It does not search all possible
          future trees. A locally best question is not a guarantee of the
          globally best tree.
        </p>
      </Section>
    </>
  );
}
