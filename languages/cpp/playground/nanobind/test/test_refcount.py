import pytest
from nanobind_playground.exchange_and_ownership import (
    borrow_refcount,
    underflow_steal,
    get_new_list_ptr,
    get_borrowed_ptr,
    manual_incref,
    manual_decref,
    get_refcount,
    wrap_steal,
    wrap_borrow
)

GET_REFCOUNT_OWN_REF_COUNT = 1

def test_refcount_helpers():
    l = []
    base = get_refcount(l)
    # l itself and the parameter passed into get_refcount!
    assert base == 1 + GET_REFCOUNT_OWN_REF_COUNT

    manual_incref(l)
    assert get_refcount(l) == base + 1

    manual_decref(l)
    assert get_refcount(l) == base

class TestSteal:
    def test_steal(self):
        l_ptr = get_new_list_ptr()
        obj_steal = wrap_steal(l_ptr)
        ref_steal = get_refcount(obj_steal)

        # Should be only one ref but there's another one for get_refcount own's argument
        assert ref_steal == 1 + GET_REFCOUNT_OWN_REF_COUNT

    def test_reference_leak(self):
        l_ptr = get_new_list_ptr()
        obj_borrow = wrap_borrow(l_ptr)
        """
        This will leak as there's only one owner (obj_borrow) but there's a refcount of 2
        """
        ref_borrow = get_refcount(obj_borrow)

        assert ref_borrow == 2 + GET_REFCOUNT_OWN_REF_COUNT

class TestBorrow:
    def test_borrow(self):
        assert borrow_refcount() == 2

    def test_reference_underflow(self):
        # Not very deterministic
        # for i in range(1000):
        #     underflow_steal()
        pass
