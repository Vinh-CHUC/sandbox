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
a = Value(665.0, label="a")
b = Value(2.0, label="b")
c = Value(1.0, label="c")
d = Value(2.0, label="d")
e = Value(5.0, label="e")
f = Value(6.0, label="f")
g = Value(7.0, label="g")
v = (((ab := a + b) * (cd := c + d)) * (ef := e + f)) + g
ab.label = "a+b"
ef.label = "e+f"

v.grad = 1
v._backward()
r.generate_graph(v)

# %%
