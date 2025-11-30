from nanobind_playground.exchanging_information import double_it, double_it_mut

def test_type_casters():
    assert double_it([1, 2, 3]) == [2, 4, 6]

    l = [1, 2, 3]
    double_it_mut([1, 2, 3])
    # Didn't change as internally things are converted (copied)
    assert l == [1, 2, 3]
