from playground.globals import mod
from playground.globals.mod import SOME_GLOBAL


def hello():
    print("Inside mod2, through module:", mod.SOME_GLOBAL)
    print("Inside mod2, direct:", SOME_GLOBAL)
