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

class TestExchangingInformation:
    @staticmethod
    def modify(d: BoundData):
        d.set("hello")

    def test_stack_var_is_copied(self):
        cbs = Callbacks()
        cbs.register_callback("bar", self.modify)

        # This returns whether the internal cpp was unchanged
        assert cbs.call_callback_1_stack_unchanged("bar")

    def test_managed_pointers_not_supported(self):
        cbs = Callbacks()
        cbs.register_callback("bar", self.modify)

        with pytest.raises(RuntimeError, match="std::bad_cast"):
            assert cbs.call_callback_1_unique_ptr("bar")

        with pytest.raises(RuntimeError, match="std::bad_cast"):
            assert cbs.call_callback_1_shared_ptr("bar")

    def test_pointer(self):
        cbs = Callbacks()
        cbs.register_callback("bar", self.modify)
        assert not cbs.call_callback_1_ptr_changed("bar")
