"""Readable binary CART-style classifier, deliberately optimized for teaching.

Supports finite numeric features and labels 0/1. It does not implement missing
values, categorical splits, weights, pruning, or production optimizations.
"""
from dataclasses import dataclass
import numpy as np


@dataclass
class Node:
    probability: float
    samples: int
    impurity: float
    depth: int
    feature: int | None = None
    threshold: float | None = None
    gain: float = 0.0
    left: "Node | None" = None
    right: "Node | None" = None

    @property
    def prediction(self):
        return int(self.probability > .5)  # exact ties choose class 0


# region impurity
def impurity(y, criterion="gini"):
    if criterion not in {"gini", "entropy"}:
        raise ValueError("criterion must be gini or entropy")
    if len(y) == 0:
        return 0.0
    p = np.bincount(y, minlength=2) / len(y)
    if criterion == "gini":
        return float(1 - np.sum(p ** 2))
    positive = p[p > 0]  # defines 0 * log2(0) as 0
    return float(-np.sum(positive * np.log2(positive)))
# endregion impurity


# region split
def best_split(X, y, criterion="gini", min_leaf=1):
    parent = impurity(y, criterion)
    best_gain, best = 1e-12, None
    for feature in range(X.shape[1]):
        values = np.unique(X[:, feature])  # sorted, distinct values
        thresholds = (values[:-1] + values[1:]) / 2
        for threshold in thresholds:
            left = X[:, feature] <= threshold
            n_left, n_right = int(left.sum()), int((~left).sum())
            if min(n_left, n_right) < min_leaf:
                continue
            weighted = (n_left * impurity(y[left], criterion)
                        + n_right * impurity(y[~left], criterion)) / len(y)
            gain = parent - weighted
            if gain > best_gain:
                best_gain = gain
                best = (feature, float(threshold), left, gain)
    return best
# endregion split


class ScratchTree:
    def __init__(self, max_depth=3, min_leaf=3, criterion="gini"):
        if not isinstance(max_depth, int) or max_depth < 0:
            raise ValueError("max_depth must be a nonnegative integer")
        if not isinstance(min_leaf, int) or min_leaf < 1:
            raise ValueError("min_leaf must be a positive integer")
        if criterion not in {"gini", "entropy"}:
            raise ValueError("criterion must be gini or entropy")
        self.max_depth, self.min_leaf, self.criterion = max_depth, min_leaf, criterion
        self.root = None

    def fit(self, X, y):
        X, y = np.asarray(X, dtype=float), np.asarray(y)
        if X.ndim != 2 or X.shape[1] == 0 or y.ndim != 1 or len(X) != len(y) or len(y) == 0:
            raise ValueError("X must be (n, d), y must be (n,), with n,d > 0")
        if not np.isfinite(X).all() or not np.isin(y, [0, 1]).all():
            raise ValueError("Use finite numeric X and binary labels 0/1")
        self.n_features = X.shape[1]
        self.root = self._grow(X, y.astype(int), 0)
        return self

    # region grow
    def _grow(self, X, y, depth):
        node = Node(float(y.mean()), len(y), impurity(y, self.criterion), depth)
        if depth >= self.max_depth or node.impurity == 0 or len(y) < 2 * self.min_leaf:
            return node
        split = best_split(X, y, self.criterion, self.min_leaf)
        if split is None:  # no valid, positive-gain split
            return node
        feature, threshold, left, gain = split
        node.feature, node.threshold, node.gain = feature, threshold, gain
        node.left = self._grow(X[left], y[left], depth + 1)
        node.right = self._grow(X[~left], y[~left], depth + 1)
        return node
    # endregion grow

    # region predict
    def predict_proba(self, X):
        if self.root is None:
            raise ValueError("Call fit before predict")
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or X.shape[1] != self.n_features or not np.isfinite(X).all():
            raise ValueError("X must have the fitted feature count and finite values")
        probabilities = []
        for row in X:
            node = self.root
            while node.feature is not None:
                node = node.left if row[node.feature] <= node.threshold else node.right
            probabilities.append([1 - node.probability, node.probability])
        return np.asarray(probabilities).reshape(-1, 2)

    def predict(self, X):
        return self.predict_proba(X).argmax(axis=1)
    # endregion predict


def nodes(root):
    yield root
    if root.left is not None:
        yield from nodes(root.left)
        yield from nodes(root.right)
