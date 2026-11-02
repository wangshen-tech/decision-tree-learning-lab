import { Callout, Code, MathFormula, Section } from "../components/UI";
export default function Theory() {
  return (
    <>
      <Section
        eyebrow="A SMALL MATHEMATICAL TOOLKIT"
        title="Measure the mixture. Choose the improvement."
      >
        <p>
          Let a node contain a dataset D with n observations and K classes. In
          our project K = 2. The math below tells us what to predict in a leaf
          and how to choose a split. All calculations use only the training rows
          that reach the current node.
        </p>
      </Section>
      <Section
        eyebrow="01 · CLASS PROPORTIONS"
        title="What should a leaf predict?"
      >
        <MathFormula>{String.raw`p_k=\frac{n_k}{n},\qquad \hat y=\arg\max_k p_k`}</MathFormula>
        <p>
          <strong>Symbols:</strong> n is the number of observations in the node;
          nₖ counts class k; pₖ is that class’s empirical proportion. The argmax
          returns the class with the largest proportion.
        </p>
        <p>
          <strong>Why:</strong> choosing the most frequent class minimizes the
          number of classification mistakes within that leaf. These proportions
          also supply an estimate of class probability, though small leaves can
          be very overconfident.
        </p>
        <p>
          <strong>Example:</strong> 3 normal and 1 alert give p₀ = 0.75 and p₁ =
          0.25, so predict normal. Our implementation breaks a 50/50 tie in
          favor of class 0.
        </p>
        <Code
          title="tree.py · Node and predict"
          code={
            "p = np.bincount(y, minlength=2) / len(y)\npredicted_class = p.argmax()  # first class wins ties"
          }
        />
      </Section>
      <Section eyebrow="02 · GINI IMPURITY" title="How mixed is this node?">
        <MathFormula>{String.raw`G(D)=1-\sum_{k=1}^{K}p_k^2`}</MathFormula>
        <p>
          <strong>Symbols:</strong> G(D) is the impurity of D; K is the number
          of classes; pₖ is the proportion of class k. Class numbering here is
          conventional 1…K; code uses 0 and 1.
        </p>
        <p>
          <strong>Why:</strong> the sum of squared proportions is the
          probability that two independent class draws from this node agree.
          Subtracting from one measures disagreement. Pure nodes have Gini 0; a
          balanced binary node has the maximum 0.5.
        </p>
        <p>
          <strong>Example:</strong> for 3 normal and 1 alert, G = 1 − (0.75² +
          0.25²) = <strong>0.375</strong>. For a 6/6 parent, G = 0.5.
        </p>
        <Code
          title="tree.py · impurity"
          code={
            "p = np.bincount(y, minlength=2) / len(y)\ngini = 1 - np.sum(p ** 2)"
          }
        />
      </Section>
      <Section
        eyebrow="03 · ENTROPY"
        title="An alternative measure of uncertainty"
      >
        <MathFormula>{String.raw`H(D)=-\sum_{k=1}^{K} p_k\log_2 p_k,\qquad 0\log_2 0:=0`}</MathFormula>
        <p>
          <strong>Symbols:</strong> H is entropy in bits, pₖ is a class
          proportion, and log₂ is the base-two logarithm. A zero-probability
          class contributes zero.
        </p>
        <p>
          <strong>Why:</strong> −log₂ p measures the surprise of a class; the
          weighted sum is average surprise. Like Gini, entropy is zero for a
          pure node. Its maximum is log₂ K, which equals 1 bit for two balanced
          classes.
        </p>
        <p>
          <strong>Example:</strong> H(3 normal, 1 alert) = −0.75 log₂(0.75) −
          0.25 log₂(0.25) ≈ <strong>0.8113 bits</strong>. Gini and entropy have
          different scales, so compare gains within the same criterion.
        </p>
        <Code
          title="tree.py · impurity"
          code={
            "positive = p[p > 0]\nentropy = -np.sum(positive * np.log2(positive))"
          }
        />
      </Section>
      <Section
        eyebrow="04 · WEIGHTED IMPURITY REDUCTION"
        title="Which question should we ask?"
      >
        <MathFormula>{String.raw`D_L=\{(x,y)\in D:x_j\le t\},\quad D_R=D\setminus D_L`}</MathFormula>
        <MathFormula>{String.raw`\Delta I(j,t)=I(D)-\left[\frac{n_L}{n}I(D_L)+\frac{n_R}{n}I(D_R)\right]`}</MathFormula>
        <p>
          <strong>Symbols:</strong> j selects a feature; t is a threshold; Dₗ
          and Dᵣ are the children; nₗ and nᵣ are their sample counts; n = nₗ +
          nᵣ. I is either Gini or entropy. ΔI is the reduction in impurity.
        </p>
        <p>
          <strong>Why:</strong> each observation should have equal influence, so
          a large child contributes more than a small one. Choose the valid
          feature–threshold pair with the largest ΔI. Under entropy this is
          information gain; here we use “impurity reduction” for both criteria.
        </p>
        <p>
          <strong>Example from the lab:</strong> temperature ≤ 5 splits 6/6 into
          (5 normal, 1 alert) and (1 normal, 5 alerts). Each child has G = 1 −
          (5/6)² − (1/6)² = 5/18. Weighted impurity is 5/18, and reduction is
          1/2 − 5/18 = <strong>2/9 ≈ 0.2222</strong>.
        </p>
        <Code
          title="tree.py · best_split"
          code={
            "left = X[:, feature] <= threshold\nweighted = (left.sum() * impurity(y[left])\n            + (~left).sum() * impurity(y[~left])) / len(y)\ngain = impurity(y) - weighted"
          }
        />
        <Callout title="Local gain versus a library stopping parameter">
          Our search compares reductions within a node. scikit-learn’s
          min_impurity_decrease additionally multiplies the local reduction by
          the node’s fraction of all training samples. We do not implement that
          parameter.
        </Callout>
      </Section>
      <Section eyebrow="05 · REGULARIZATION" title="Give complexity a cost">
        <p>
          Our project uses <strong>pre-pruning</strong>: maximum depth and
          minimum samples per leaf prevent excessive growth. Another approach
          grows a tree and then removes subtrees using cost-complexity pruning.
        </p>
        <MathFormula>{String.raw`R_\alpha(T)=\underbrace{\sum_{\ell\in\mathcal L(T)}\frac{n_\ell}{N}I(D_\ell)}_{R(T)}+\alpha\,|\mathcal L(T)|`}</MathFormula>
        <p>
          <strong>Symbols:</strong> T is a tree; ℒ(T) is its set of leaves;
          |ℒ(T)| is its leaf count; N is the total training count; nℓ and Dℓ
          describe leaf ℓ. R(T) is weighted leaf impurity, and α ≥ 0 is the
          complexity penalty.
        </p>
        <p>
          <strong>Why:</strong> a larger tree must reduce impurity enough to
          justify its extra leaves. Larger α favors smaller subtrees. Select α
          using validation data or cross-validation.
        </p>
        <p>
          <strong>Example:</strong> tree A has R = 0.10 and 5 leaves; tree B has
          R = 0.16 and 2 leaves. At α = 0.03, their costs are 0.25 and 0.22, so
          B is preferred.
        </p>
        <Code
          title="scikit-learn extension · not part of ScratchTree"
          code={
            "model = DecisionTreeClassifier(ccp_alpha=0.03, random_state=42)\nmodel.fit(X_train, y_train)"
          }
        />
      </Section>
      <Section
        eyebrow="06 · BEYOND CLASSIFICATION"
        title="The same structure can predict a number"
      >
        <MathFormula>{String.raw`\bar y_D=\frac1n\sum_{i=1}^n y_i,\qquad I(D)=\frac1n\sum_{i=1}^n(y_i-\bar y_D)^2`}</MathFormula>
        <p>
          <strong>Symbols:</strong> yᵢ is a numeric target, n is the node size,
          and ȳD is its mean. I(D) is the mean squared deviation within the
          node.
        </p>
        <p>
          <strong>Why:</strong> the mean minimizes squared error. A regression
          tree searches for splits that reduce the weighted squared error, and
          leaves predict means instead of classes.
        </p>
        <p>
          <strong>Example:</strong> targets [2, 4, 6] have mean 4 and impurity
          (4 + 0 + 4)/3 = <strong>8/3</strong>.
        </p>
        <Code
          title="Regression variant · conceptual core"
          code={
            "leaf_prediction = y.mean()\nimpurity = np.mean((y - leaf_prediction) ** 2)"
          }
        />
        <p className="small-copy">
          This course implements binary classification. Regression is an
          extension, not a behavior claimed by the provided ScratchTree class.
        </p>
      </Section>
    </>
  );
}
