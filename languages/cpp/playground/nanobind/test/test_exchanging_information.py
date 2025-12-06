import pytest

from nanobind_playground.exchanging_information import (
    bind_double_it, bind_double_it_mut, double_it_py,
    double_it, double_it_mut, IntVector,
    kaboom, create_uptr, consume_uptr
)

def test_type_casters():
    assert double_it([1, 2, 3]) == [2, 4, 6]

    l = [1, 2, 3]
    double_it_mut(l)
    # Didn't change as internally things are converted (copied)
    assert l == [1, 2, 3]

def test_bindings():
    assert bind_double_it([1, 2, 3]) == [2, 4, 6]

    # IntVector here binds to an std::vector
    l = IntVector([1, 2, 3])
    bind_double_it_mut(l)
    # I think __eq__ on IntVector accepts another IntVector which itself implicitly constructs from
    # any Sequence?
    assert l == [2, 4, 6]
    assert l == (2, 4, 6)

    l = [1, 2, 3]
    bind_double_it_mut(l)
    assert l != [2, 4, 6]
    assert l != (2, 4, 6)

def test_wrappers():
    l = [1, 2, 3]
    assert double_it_py(l) == [2, 4, 6]

def test_kaboom():
    # kaboom()
    pass

def foo(x):
    return x

def test_unique_ptr():
    data = create_uptr() 
    consume_uptr(data)

    with pytest.raises(TypeError):
        # Has already been consumed by consume_uptr (which takes a std::unique_ptr)
        consume_uptr(data)
    
    # These are fine there are other referencess to the wrapper around the unique_ptr
    foo(data)
    data2 = data
