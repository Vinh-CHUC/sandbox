# ---
# jupyter:
#   jupytext:
#     formats: py:percent
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#       jupytext_version: 1.19.5
#   kernelspec:
#     display_name: Python 3 (ipykernel)
#     language: python
#     name: python3
# ---

# %% [markdown]
# ## Micrograd notebook

# %%
import numpy as np
import plotting
from IPython import get_ipython
import altair as alt

ipython = get_ipython()

if ipython is not None and ipython.__class__.__name__ == "TerminalInteractiveShell":
    alt.renderers.enable("browser", using="firefox")

# %%
def f(x):
    return 3*x**2 - 4*x + 5

# %%
x = np.linspace(-1, 1, 20)
y = f(x)
plotting.twod([x, y], mark="line")

# %%
x = np.linspace(-10, 10, 20)
y = np.tanh(x)
plotting.twod([x, y], mark="line")

# %%
from maths.deep_learning.karpathy_zero_to_hero.micrograd import Value
from maths.deep_learning.karpathy_zero_to_hero.micrograd.visualisation import GraphVizRenderer
r = GraphVizRenderer()
a = Value(1.0, label="a")
b = Value(1.0, label="b")
c = Value(1.0, label="c")
d = Value(1.0, label="d")

e = a * b
f = e.tanh()
g = e.tanh()
e.label = "e"
f.label = "f"
g.label = "g"

h = c * d
h.label = "h"
i = h.tanh()
i.label = "i"

L = (fg := f * g) * i
fg.label = "j"
L.label = "L"

L.grad = 1
L.backward()
r.generate_graph(L)

# %%
