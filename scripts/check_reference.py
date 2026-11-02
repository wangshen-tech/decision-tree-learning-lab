"""Verify the documented default output against a fresh run, with float tolerance."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1] / "project"


def compare(a, b, path="root"):
    if isinstance(a, dict):
        assert a.keys() == b.keys(), path
        for key in a:
            compare(a[key], b[key], f"{path}.{key}")
    elif isinstance(a, list):
        assert len(a) == len(b), path
        for i, (x, y) in enumerate(zip(a, b)):
            compare(x, y, f"{path}[{i}]")
    elif isinstance(a, (float, int)) and not isinstance(a, bool):
        assert abs(a - b) < 1e-10, f"{path}: {a} != {b}"
    else:
        assert a == b, f"{path}: {a} != {b}"


compare(json.loads((root / "reference/results.json").read_text()), json.loads((root / "output/results.json").read_text()))
print("Fresh Python output matches the documented reference.")
