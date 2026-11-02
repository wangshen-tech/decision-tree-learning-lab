# Decision Tree Lab

A complete, interactive field guide to decision trees, from the first split to a reproducible Python classifier.

The site uses **React + TypeScript + Vite + Tailwind CSS**, KaTeX for accessible mathematics, Prism for code highlighting, and custom SVG visualizations driven by the actual tree algorithm. It is a static application compatible with GitHub Pages. Python runs locally, not on GitHub Pages.

## Website and source

- Repository: https://github.com/wangshen-tech/decision-tree-learning-lab
- Online teaching site: https://wangshen-tech.github.io/decision-tree-learning-lab/
- Local preview: `http://127.0.0.1:5173/`
- Every website build includes downloadable ZIPs containing the full Python project and the full website source.

## What you will learn

1. **Introduction** — inputs, outputs, practical motivation, and a simple sensor example.
2. **Core intuition** — move a threshold, change the feature or criterion, inspect candidate splits.
3. **Mathematics** — class proportions, Gini, entropy, weighted reduction, pruning, and a regression extension; each with symbols, motivation, a numerical example, and code.
4. **Algorithm** — grow a real tree one split at a time, with synchronized regions and node diagram.
5. **Mini-project** — generate data, implement a classifier, train, select complexity, evaluate, and experiment.
6. **Code walkthrough** — actual source excerpts with line-level explanations, full files, copying, and downloads.
7. **Review** — eight key ideas, interactive questions, five interview answers, misconceptions, and three extensions.

Chapter links use URL hashes so deep links work on static hosts. Completion progress is stored only in the visitor's browser. Numeric sliders and selects work with a keyboard; class identity uses shape as well as color. The layout supports desktop and mobile screens.

## Run the website

Requirements: Node.js 24, Python 3.11 or 3.12 (for source ZIP packaging), and pnpm 11.25.0. On Windows, ensure `python3` is available on PATH for the build script, or run `python scripts/package_sources.py` followed by `pnpm exec tsc -b` and `pnpm exec vite build`.

```bash
# If pnpm is not installed:
npm install --global pnpm@11.25.0

pnpm install --frozen-lockfile
pnpm dev
```

Production build and preview:

```bash
pnpm build
pnpm preview
```

`dist/` contains the deployable site. Vite uses `base: './'` for root and repository-subpath hosting. Do not open `dist/index.html` directly with a `file://` URL; use the preview server. Math fonts, source ZIPs, and application assets are bundled locally; the page does not rely on external CDNs.

## Run the Python project

```bash
cd project
python3 -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
python -m unittest discover -s . -v
```

Runs on an ordinary CPU; no GPU, account, or dataset download is required. The default command generates 240 synthetic observations and splits them into **144 training / 48 validation / 48 test** rows. It fits depths 1–8, selects the first highest validation score (shallower wins ties), and evaluates the selected fitted model on the test set without refitting. A scikit-learn comparison uses the same depth and constraints.

Files written into `project/output/`:

- `results.json`: metrics, selected depth, root split, and predictions.
- `sensor_data.csv`: feature values, labels, and partition membership.
- `experiment.png`: decision regions, depth curves, confusion matrix.
- `sklearn_tree.png`: rendered library model.

## Reproduce the reference and experiments

The tracked `project/reference/` directory contains actual outputs from the default run, not fabricated examples. Default settings are seed 42, noise 0.08, minimum leaf size 3, Gini. Reference results:

| Quantity | Result |
| --- | --- |
| Selected maximum depth | 4 |
| Validation accuracy | 43/48 = 89.5833% |
| Scratch test accuracy | 44/48 = 91.6667% |
| scikit-learn test accuracy | 44/48 = 91.6667% |
| Test confusion matrix (actual rows, predicted columns) | `[[29, 0], [4, 15]]` |
| Test precision / recall / F1 | 1.0 / 0.789474 / 0.882353 |
| Training-majority test baseline | 29/48 = 60.4167% |

From `project/`:

```bash
python main.py --seed 42 --noise 0.08 --min-leaf 3 --criterion gini
python main.py --noise 0.20 --min-leaf 1 --output output/noisy
python main.py --criterion entropy --output output/entropy
python main.py --seed 43 --output output/seed43
```

From the repository root, after the default run:

```bash
python scripts/check_reference.py
```

The browser and Python use matching xorshift32 generation, shuffle, and binary splitting logic. The browser experiments train actual TypeScript trees and display training and **validation** results. Its test partition is reserved. The static reference figure and metrics are explicitly identified as saved Python outputs. A unit test checks all eight default browser scores against Python.

Only direct scientific dependencies are pinned in `requirements.txt`; `requirements-lock.txt` records the full environment used for the included run. For the tightest reproduction on Python 3.12, install the latter. Exact tied split choices can differ with platform, precision, or library version. The scratch implementation and scikit-learn are not claimed to be identical.

## Tests

```bash
pnpm test
pnpm exec playwright install chromium
pnpm test:ui
python -m unittest discover -s project -v
```

If Chrome is already installed locally, `PLAYWRIGHT_CHANNEL=chrome pnpm test:ui` uses a fresh, isolated Chrome test session. CI installs Playwright Chromium.

- TypeScript tests: hand-worked impurity/gain, best split, threshold equality, stopping constraints, data partition integrity, Python parity, and learnability.
- Python tests: formulas, best midpoint, probabilities, ties, stopping rules, sample counts, invalid inputs, reproducibility, and scikit-learn agreement on an unambiguous dataset.
- Browser tests on desktop and mobile: all chapters, formula rendering, page errors, horizontal overflow, split search, step controls, depth changes, prediction routing, new seeds, reset, quizzes, persisted progress, code-file selection, and real ZIP downloads.

## Repository layout

```text
src/
  App.tsx                  # navigation, progress, chapter routing
  chapters/                # the seven lessons
  components/UI.tsx        # formula, code, slider and shared components
  visualizations/          # split, growth, experiment labs and SVG charts
  lib/tree.ts              # actual browser decision-tree algorithm
project/
  data.py                  # reproducible sensor data and partitions
  tree.py                  # NumPy classifier from scratch
  main.py                  # experiment, metrics and plots
  test_tree.py             # algorithm tests
  requirements.txt
  reference/               # checked reference results
scripts/
  package_sources.py       # generate downloadable ZIPs
  check_reference.py       # compare a fresh run with documented results
tests/                     # TypeScript and browser tests
.github/workflows/deploy.yml
```

## GitHub Pages deployment

The workflow tests Python and TypeScript, checks reference outputs, builds, runs browser tests, and deploys `dist/`. Pull requests run the checks without publishing. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.

For a fresh copy, authenticate through GitHub's official browser login; never paste tokens into chat:

```bash
gh auth login --hostname github.com --web
git init -b main
git add .
git commit -m "Build interactive decision-tree learning lab"
gh repo create decision-tree-learning-lab --public --source=. --remote=origin
git push -u origin main
gh api --method POST repos/{owner}/{repo}/pages -f build_type=workflow
# If the first workflow ran before Pages was enabled, rerun it:
gh workflow run deploy.yml
gh run list --workflow deploy.yml
gh run watch
gh api repos/{owner}/{repo}/pages --jq .html_url
```

If Pages is already enabled, use `gh api --method PUT repos/{owner}/{repo}/pages -f build_type=workflow` instead of POST. If a repository already exists, add its remote with `git remote add origin https://github.com/OWNER/REPOSITORY.git` rather than creating another. Repository creation and Pages availability depend on account access and plan.

Deployment references: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages).

## Teaching scope

The scratch tree handles finite numeric features and binary labels 0/1. It uses strictly positive local gain, stopping at zero gain; this can prevent learning XOR when its first split gives no improvement. It does not implement sample weights, missing values, categorical splits, multiclass classification, regression, or post-pruning. Those concepts are distinguished from implemented features in the lessons.

The data are fictional, independent observations; this is not a validated industrial alerting system. Real sensor data may require time-based splitting, different error costs, missing-data processing, probability calibration, drift monitoring, and an optimized library model.

Further reading: [scikit-learn decision trees](https://scikit-learn.org/stable/modules/tree.html), [classifier API](https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html), and [model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html).
