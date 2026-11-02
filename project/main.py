"""Train, tune, evaluate, and visualize both a scratch and sklearn tree."""
import argparse
import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import numpy as np
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score
from data import make_data, split_indices
from tree import ScratchTree, nodes


def metrics(model, X, y):
    prediction = model.predict(X)
    return {"accuracy": float(accuracy_score(y, prediction)),
            "precision": float(precision_score(y, prediction, zero_division=0)),
            "recall": float(recall_score(y, prediction, zero_division=0)),
            "f1": float(f1_score(y, prediction, zero_division=0)),
            "confusion_matrix": confusion_matrix(y, prediction, labels=[0, 1]).tolist()}


def run(seed=42, noise=.08, min_leaf=3, criterion="gini", output=Path("output")):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    X, y = make_data(seed=seed, noise=noise)
    train, validation, test = split_indices(len(y))
    # region tune
    experiments, models = [], []
    for depth in range(1, 9):
        model = ScratchTree(depth, min_leaf, criterion).fit(X[train], y[train])
        models.append(model)
        experiments.append({"depth": depth,
                            "train_accuracy": float(accuracy_score(y[train], model.predict(X[train]))),
                            "validation_accuracy": float(accuracy_score(y[validation], model.predict(X[validation]))),
                            "leaves": sum(node.feature is None for node in nodes(model.root))})
    # First maximum chooses the shallower model on validation ties.
    best_index = int(np.argmax([row["validation_accuracy"] for row in experiments]))
    selected = models[best_index]
    best_depth = best_index + 1
    # endregion tune
    # Do not refit: keep the exact selected training-only model for the lesson.
    library = DecisionTreeClassifier(max_depth=best_depth, min_samples_leaf=min_leaf,
                                     criterion=criterion, random_state=seed).fit(X[train], y[train])
    # Test labels are consulted only after hyperparameter selection.
    root = selected.root
    result = {"seed": seed, "noise": noise, "min_leaf": min_leaf, "criterion": criterion,
              "shapes": {"X": list(X.shape), "y": list(y.shape), "train": len(train),
                         "validation": len(validation), "test": len(test)},
              "first_row": X[0].tolist(), "first_label": int(y[0]),
              "selected_depth": best_depth, "experiments": experiments,
              "root": {"feature": root.feature, "threshold": root.threshold,
                       "impurity": root.impurity, "gain": root.gain},
              "scratch_test": metrics(selected, X[test], y[test]),
              "sklearn_test": metrics(library, X[test], y[test]),
              "majority_test_accuracy": float(np.mean(y[test] == np.bincount(y[train]).argmax())),
              "sample_prediction": {"X": [[8., 6.]], "class": int(selected.predict([[8., 6.]])[0]),
                                    "probability": selected.predict_proba([[8., 6.]])[0].tolist()}}
    (output / "results.json").write_text(json.dumps(result, indent=2) + "\n")
    split = np.empty(len(y), dtype="U10")
    split[train], split[validation], split[test] = "train", "validation", "test"
    np.savetxt(output / "sensor_data.csv", np.column_stack([X, y, split]), delimiter=",", fmt="%s",
               header="temperature,vibration,label,split", comments="")

    cmap = ListedColormap(["#d4e9df", "#f4d9c6"])
    grid = np.linspace(0, 10, 180)
    xx, yy = np.meshgrid(grid, grid)
    Z = selected.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.4), layout="constrained")
    axes[0].contourf(xx, yy, Z, levels=[-.5, .5, 1.5], cmap=cmap)
    for label, color, marker, name in [(0, "#217768", "o", "Normal"), (1, "#c66a35", "^", "Alert")]:
        mask = test[y[test] == label]
        axes[0].scatter(X[mask, 0], X[mask, 1], c=color, marker=marker, edgecolors="white", label=name)
    axes[0].set(xlabel="Temperature (0–10)", ylabel="Vibration (0–10)", title="Held-out test predictions")
    axes[0].legend()
    for key, label, color in [("train_accuracy", "Training", "#217768"), ("validation_accuracy", "Validation", "#c66a35")]:
        axes[1].plot(range(1, 9), [row[key] for row in experiments], "o-", label=label, color=color)
    axes[1].axvline(best_depth, linestyle="--", color="#999999")
    axes[1].set(xlabel="Maximum depth", ylabel="Accuracy", ylim=(0, 1.05), title="Select depth using validation")
    axes[1].legend()
    matrix = result["scratch_test"]["confusion_matrix"]
    axes[2].imshow(matrix, cmap="Greens")
    for i in range(2):
        for j in range(2):
            axes[2].text(j, i, str(matrix[i][j]), ha="center", va="center", fontsize=20, color="black",
                         bbox={"facecolor": "white", "alpha": .8, "edgecolor": "none"})
    axes[2].set(xticks=[0, 1], yticks=[0, 1], xticklabels=["Normal", "Alert"], yticklabels=["Normal", "Alert"],
                xlabel="Predicted", ylabel="Actual", title="Test confusion matrix")
    fig.savefig(output / "experiment.png", dpi=150)
    plt.close(fig)
    fig, ax = plt.subplots(figsize=(15, 7))
    plot_tree(library, feature_names=["temperature", "vibration"], class_names=["normal", "alert"],
              filled=True, rounded=True, ax=ax, fontsize=8)
    fig.savefig(output / "sklearn_tree.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--noise", type=float, default=.08)
    parser.add_argument("--min-leaf", type=int, default=3)
    parser.add_argument("--criterion", choices=["gini", "entropy"], default="gini")
    parser.add_argument("--output", type=Path, default=Path(__file__).parent / "output")
    args = parser.parse_args()
    print(json.dumps(run(args.seed, args.noise, args.min_leaf, args.criterion, args.output), indent=2))
