import pytest
import subprocess
import sys
import os
import inspect
import textwrap

from nanobind_playground.exchange_and_ownership import (
    make_owning_capsule,
    make_coowning_capsule,
    make_coowning_capsule_noret
)

def test_safe_capsule():
    cap = make_owning_capsule()
    assert cap is not None
    del cap

def run_in_subprocess(func):
    """
    Grabs the source of 'func', adds a call to it, 
    and runs it in an isolated process.
    """
    # Get the source of the function
    lines = inspect.getsource(func)
    # The first line might be indented if it's a nested function
    script = textwrap.dedent(lines) + f"\n{func.__name__}()"
    
    return subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        env=os.environ.copy()
    )

class TestInterpreterCrash:
    def test_unsafe_capsule_crash(self):
        def trigger_double_free():
            from nanobind_playground.exchange_and_ownership import make_coowning_capsule
            c = make_coowning_capsule()
            del c

        res = run_in_subprocess(trigger_double_free)
        assert res.returncode != 0
        assert "double free detected" in res.stderr

    def test_unsafe_capsule_crash_2(self):
        """
        This proves that the nb::capsule doesn't need to be attached to a "real" python object to
        trigger its delete
        """
        def trigger_double_free():
            from nanobind_playground.exchange_and_ownership import make_coowning_capsule_noret
            c = make_coowning_capsule_noret()
            del c

        res = run_in_subprocess(trigger_double_free)
        assert res.returncode != 0
        assert "double free detected" in res.stderr
