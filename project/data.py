"""Reproducible, fictional sensor observations. No external downloads.

The xorshift32 generator and shuffle match src/lib/tree.ts exactly.
Values are dimensionless readings on [0, 10), not measurements in SI units.
"""
import numpy as np


def random_stream(seed):
    state = seed & 0xFFFFFFFF or 1
    while True:
        state ^= (state << 13) & 0xFFFFFFFF
        state ^= state >> 17
        state ^= (state << 5) & 0xFFFFFFFF
        state &= 0xFFFFFFFF
        yield state / 4294967296


def make_data(seed=42, noise=0.08, n=240):
    if not 0 <= noise <= 1 or n < 5:
        raise ValueError("noise must be in [0, 1]; n must be at least 5")
    random = random_stream(seed)
    X, y = [], []
    for _ in range(n):
        temperature, vibration = next(random) * 10, next(random) * 10
        label = int((temperature > 5.5 and vibration > 3) or vibration > 7.5)
        if next(random) < noise:
            label = 1 - label
        X.append([temperature, vibration])
        y.append(label)
    return np.asarray(X, dtype=float), np.asarray(y, dtype=int)


def split_indices(n):
    """Fixed, random 60/20/20 split. No target information enters the shuffle."""
    indices, random = list(range(n)), random_stream(7)
    for i in range(n - 1, 0, -1):
        j = int(next(random) * (i + 1))
        indices[i], indices[j] = indices[j], indices[i]
    return tuple(np.asarray(part, dtype=int) for part in (
        indices[:int(n * .6)], indices[int(n * .6):int(n * .8)], indices[int(n * .8):]))
