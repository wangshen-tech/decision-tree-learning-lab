# Build a decision tree from scratch

Goal: predict a fictional machine alert from temperature and vibration readings. Features are dimensionless values in `[0, 10)`. Labels are generated from a hidden rule and independently flipped with probability 0.08. No external dataset or GPU is needed.

Use Python 3.11 or 3.12. From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
python -m unittest discover -s . -v
```

`requirements-lock.txt` records the complete Python 3.12 environment for the reference run. Install it instead of `requirements.txt` for a tighter reproduction.

Read the code in order:

1. `data.py` creates `X` with shape `(240, 2)` and `y` with shape `(240,)`. Its fixed random shuffle yields 144 training, 48 validation, and 48 test rows.
2. `tree.py` computes Gini or entropy, tests adjacent-value midpoints, recursively builds binary children, and predicts using class proportions. `best_split` is the core learning routine.
3. `main.py` trains depths 1–8, selects depth using validation accuracy only, compares with scikit-learn, then evaluates both models on the held-out test rows.
4. `test_tree.py` checks the math, threshold boundaries, probability outputs, stopping conditions, shape validation, reproducibility, and an unambiguous library comparison.

Outputs in `output/`: `results.json`, `sensor_data.csv`, `experiment.png`, `sklearn_tree.png`.

The default reference run selects depth **4**. Test accuracy is **44/48 (91.67%)**, with confusion matrix `[[29, 0], [4, 15]]` (actual rows, predicted columns). This small evaluation is noisy; it does not establish real-world reliability. The selected training-only model is retained without refitting.

Experiments:

```bash
python main.py --noise 0.2 --min-leaf 1 --output output/noisy
python main.py --criterion entropy --output output/entropy
python main.py --seed 43 --output output/seed43
```

Each run sweeps depths 1–8 and records actual training and validation metrics. Choose a model using validation; never repeatedly tune against the test score. Adjust one parameter at a time while keeping the seed fixed when comparing model settings.

The teaching implementation supports finite numeric features and binary labels only. It deliberately stops on zero-gain splits and lacks production optimizations, missing-data handling, sample weights, multiclass support, and post-pruning. Library tie choices and zero-gain behavior may differ. Leaf proportions are not calibrated probability guarantees.
