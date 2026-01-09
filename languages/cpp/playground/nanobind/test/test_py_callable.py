import pytest

from nanobind_playground.py_callable import BoundData, Callbacks

def test_callbacks():
    cbs = Callbacks()
    cbs.register_callback("foo", lambda: 5)

    cbs.register_callback("bar", lambda x: "bonjour " + x)

    assert cbs.call_callback_0("foo") == 5
    assert cbs.call_callback_1("bar", "vinh") == "bonjour vinh"

    
def test_cant_call_py_with_non_bound_cpp():
    cbs = Callbacks()

    cbs.register_callback("bar", lambda x: x)

    # Can't call a python lambda with a cpp object that hasn't been exposed to Python
    with pytest.raises(RuntimeError):
        cbs.call_callback_1_with_unbound_cpp("bar")

    assert type(cbs.call_callback_1_with_bound_cpp("bar")) == BoundData
