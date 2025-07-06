import numpy as np

from maths.proba_stats.utils import Dist

def entropy(d: Dist):
    assert len(d.shape) == 1
    return np.sum(-d * np.log2(d))
