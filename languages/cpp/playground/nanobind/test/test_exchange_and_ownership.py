import pytest

from nanobind_playground.exchange_and_ownership import (
    bind_double_it, bind_double_it_mut, bind_double_it_mut_copy, double_it_py,
    double_it, double_it_mut, IntVector,
    kaboom, create_uptr, consume_uptr, consume_uptr_2, create_sptr, receive_sptr, ping_pong,
    create_move_only_string, consume_move_only_string, Data, data_vector
)

def test_type_casters():
    assert double_it([1, 2, 3]) == [2, 4, 6]

    l = [1, 2, 3]
    double_it_mut(l)
    # Didn't change as internally things are converted (copied)
    assert l == [1, 2, 3]

    data_vector([Data(), Data()])

def test_bindings():
    assert bind_double_it([1, 2, 3]) == [2, 4, 6]

    # IntVector here binds to an std::vector
    l = IntVector([1, 2, 3])
    bind_double_it_mut(l)
    # I think __eq__ on IntVector accepts another IntVector which itself implicitly constructs from
    # any Sequence?
    assert l == [2, 4, 6]
    assert l == (2, 4, 6)

    # There's some magic here that will cast/copy the python list into the IntVector
    l = [1, 2, 3]
    bind_double_it_mut(l)
    assert l != [2, 4, 6]
    assert l != (2, 4, 6)

    # IntVector here binds to an std::vector
    l = IntVector([1, 2, 3])
    # The bound fn takes by value, copied!
    bind_double_it_mut_copy(l)
    assert l != [2, 4, 6]
    assert l != (2, 4, 6)

def test_wrappers():
    l = [1, 2, 3]
    assert double_it_py(l) == [2, 4, 6]

def test_kaboom():
    """
    This would crash Python itself
    - Interestingly one does not even need to bind the return value to a reference to trigger this
      Python interpreter crash
    kaboom()
    """
    pass


class TestSmartPointers:
    @staticmethod
    def foo(x):
        return x

    def test_unique_ptr(self):
        data = create_uptr() 
        # This is ok it's an additional ref to the wrapper around the unique_ptr
        data2 = data
        consume_uptr(data)

        with pytest.raises(TypeError):
            # Has already been consumed by consume_uptr (which takes a std::unique_ptr)
            consume_uptr(data)

        with pytest.raises(TypeError):
            # Has already been consumed by consume_uptr (which takes a std::unique_ptr)
            consume_uptr(data2)

        # These python objects are technically still valid
        self.foo(data)
        self.foo(data2)
        assert data is not None
        assert data2 is not None

    def test_unique_ptr_2(self):
        data = create_uptr()
        with pytest.raises(TypeError):
            consume_uptr_2(data, data)

        consume_uptr_2(create_uptr(), create_uptr())

    def test_shared_ptr(self):
        # Multiple references on the python side don't increase the shared_ptr ref count
        data = create_sptr()
        data2 = data

        ref_count = receive_sptr(data)
        assert ref_count == 1

def test_ping_pong():
    assert ping_pong(5) == 5
    assert ping_pong({1: 2}) == {1: 2}

def test_move_string():
    s = create_move_only_string()
    assert str(s) == "hello"
    consume_move_only_string(s)
    assert str(s) == ""
