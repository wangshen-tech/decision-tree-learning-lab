"""Build self-contained source downloads. Standard library only."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

root = Path(__file__).resolve().parents[1]
out = root / "public" / "downloads"
out.mkdir(parents=True, exist_ok=True)
ignored = {".git", "node_modules", ".venv", "dist", "__pycache__", "output", "downloads", "test-results", "playwright-report"}


def include(path):
    return not any(part in ignored for part in path.relative_to(root).parts) and not path.name.endswith((".pyc", ".tsbuildinfo")) and path.name != ".DS_Store" and not path.name.startswith(".env")


with ZipFile(out / "python-project.zip", "w", ZIP_DEFLATED) as archive:
    for path in sorted((root / "project").rglob("*")):
        if path.is_file() and include(path):
            archive.write(path, path.relative_to(root))
with ZipFile(out / "decision-tree-lab-source.zip", "w", ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob("*")):
        if path.is_file() and include(path):
            archive.write(path, Path("decision-tree-lab") / path.relative_to(root))
print("Packaged Python project and full website source.")
