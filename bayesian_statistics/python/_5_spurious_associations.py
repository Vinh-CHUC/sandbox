import collections

import pymc as pm
import pandas as pd
import numpy as np

ModelOutput = collections.namedtuple("ModelOutput", ['sample', 'posterior_predictive'])


def setup_viz_terminal():
    import altair as alt
    import arviz as az
    az.style.use("arviz-doc")
    az.rcParams["plot.backend"] = "bokeh"
    alt.renderers.enable('altair_viewer')


def mult_const(*args):
    return 1 + (np.random.randn(*args) / 4)


def add_const(*args):
    return np.random.randn(*args)


def gen_data(category: str) -> pd.DataFrame:
    SIZE = 500
    X1 = np.linspace(0, 5, SIZE) + np.random.randn(SIZE)
    X2 = np.linspace(40, 50, SIZE) + np.random.randn(SIZE)

    match category:
        # Very simple case, pure causation
        case "simple":
            Y = X1 * mult_const(SIZE) + add_const(SIZE)
        case other:
            raise NotImplementedError(f"{other} not implemented")
    return pd.DataFrame({
        "x1": X1,
        "x2": X2,
        "y": Y
    })


def viz_data():
    import altair as alt
    alt.renderers.enable('altair_viewer')
    df = gen_data('simple')
    return alt.Chart(df).mark_point().encode(x='x1', y='y').interactive()


def model(data: pd.DataFrame):
    with pm.Model():
        alpha = pm.Normal("alpha", mu=0, sigma=10)
        beta = pm.Normal("beta", mu=0, sigma=10)
        sigma = pm.HalfNormal("sigma", sigma=1)

        mu = alpha + beta * data.x1
        pm.Normal("Y_obs", mu=mu, sigma=sigma, observed=data.y)

        trace = pm.sample()

        return ModelOutput(trace, pm.sample_posterior_predictive(trace))
