import numpy as np
import pytest

from nanobind_playground.exceptions import (
    CustomEx,
    RichExc,
    throw_custom_ex,
    throw_value_error,
    throw_rich_ex,
)


def test_value_error():
    with pytest.raises(ValueError, match="Some value error"):
        throw_value_error()


def test_custom_ex():
    with pytest.raises(CustomEx, match="Custom exception"):
        throw_custom_ex()


def test_rich_ex():
    with pytest.raises(RichExc, match="Rich exception"):
        throw_rich_ex()

    try:
        throw_rich_ex()
    except RichExc as e:
        error_codes = e.info.get()

    assert np.sum(error_codes) == 10
