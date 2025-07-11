import numpy as np

from maths.proba_stats.utils import Dist


def entropy(d: Dist) -> float:
    assert len(d.shape) == 1
    return np.sum(-d * np.log2(d))


def cross_entropy(p: Dist, q: Dist) -> float:
    assert len(p.shape) == 1
    assert len(q.shape) == 1
    return np.sum(-p * np.log2(q))
