import unittest
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from data import make_data, split_indices
from tree import ScratchTree, best_split, impurity, nodes


class TreeTests(unittest.TestCase):
    def test_impurity_hand_calculation(self):
        self.assertAlmostEqual(impurity(np.array([0, 0, 0, 1])), .375)
        self.assertAlmostEqual(impurity(np.array([0, 0, 0, 1]), "entropy"), .8112781244591328)
        self.assertEqual(impurity(np.ones(5, dtype=int)), 0)

    def test_best_midpoint_and_prediction(self):
        X, y = np.array([[1], [2], [8], [9]]), np.array([0, 0, 1, 1])
        model = ScratchTree(2, 1).fit(X, y)
        self.assertEqual(model.root.threshold, 5)
        np.testing.assert_equal(model.predict([[5], [5.1]]), [0, 1])
        self.assertEqual(best_split(X, y)[3], .5)

    def test_stop_conditions_and_tie(self):
        model = ScratchTree(3, 1).fit([[1], [1]], [0, 1])
        self.assertIsNone(model.root.feature)
        self.assertEqual(model.predict([[1]])[0], 0)
        np.testing.assert_equal(model.predict_proba([[1]]), [[.5, .5]])
        self.assertIsNone(ScratchTree(0, 1).fit([[1], [9]], [0, 1]).root.feature)

    def test_leaf_constraints_and_depth(self):
        X, y = make_data()
        model = ScratchTree(4, 7).fit(X, y)
        for node in nodes(model.root):
            self.assertLessEqual(node.depth, 4)
            if node.feature is None:
                self.assertGreaterEqual(node.samples, 7)
            else:
                self.assertEqual(node.samples, node.left.samples + node.right.samples)
                self.assertGreater(node.gain, 0)

    def test_sklearn_agrees_on_unambiguous_data(self):
        X = np.arange(20).reshape(-1, 1)
        y = (X[:, 0] > 9).astype(int)
        for criterion in ["gini", "entropy"]:
            a = ScratchTree(3, 1, criterion).fit(X, y)
            b = DecisionTreeClassifier(max_depth=3, criterion=criterion, random_state=42).fit(X, y)
            np.testing.assert_equal(a.predict(X), b.predict(X))

    def test_split_integrity_and_reproducibility(self):
        X, y = make_data()
        np.testing.assert_equal(X, make_data()[0])
        parts = split_indices(len(y))
        self.assertEqual([len(p) for p in parts], [144, 48, 48])
        self.assertEqual(len(set(np.concatenate(parts))), 240)
        self.assertEqual(set(np.concatenate(parts)), set(range(240)))

    def test_invalid_input(self):
        for X, y in [([], []), ([[np.nan]], [0]), ([[1]], [2]), ([[1], [2]], [0])]:
            with self.assertRaises(ValueError):
                ScratchTree().fit(X, y)
        with self.assertRaises(ValueError):
            ScratchTree().predict([[1]])
        with self.assertRaises(ValueError):
            ScratchTree(min_leaf=0)


if __name__ == "__main__":
    unittest.main()
