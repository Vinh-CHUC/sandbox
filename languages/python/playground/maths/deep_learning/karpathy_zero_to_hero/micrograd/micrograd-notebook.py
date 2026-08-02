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
