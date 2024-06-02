import pytest

from tapl.untyped_lambda.eval import eval, shift
from tapl.untyped_lambda.parser import parse


@pytest.mark.parametrize(
    "test_input,shift_by,shift_above,expected",
    [
        ("0", 5, 0, "5"),
        ("0", 5, 1, "0"),
        ("10", 5, 10, "15"),
        ("10", 5, 11, "10"),
        ("lambda: 0", 5, 0, "(lambda: 0)"),
        ("lambda: 1", 5, 0, "(lambda: 6)"),
        ("(lambda: 1) (lambda: 1)", 5, 0, "((lambda: 6) (lambda: 6))"),
        ("lambda: 0 (lambda: 0 1 2)", 2, 0, "(lambda: (0 (lambda: ((0 1) 4))))"),
    ],
)
def test_shift(test_input, shift_by, shift_above, expected):
    term = parse(test_input)
    assert repr(shift(shift_by, shift_above, term)) == expected


@pytest.mark.parametrize(
    "a,b",
    [
        ("lambda: 0", "lambda: 0"),
        ("(lambda: 0) (lambda:  0)", "lambda: 0"),
        # The lambda being applied is constant
        ("(lambda: lambda: 0)(lambda: lambda: lambda: 0)", "lambda: 0"),
        (
            "(lambda: lambda: lambda: 0 2 1) (lambda: 0) (lambda: lambda: 0) (lambda: lambda: 1)",
            "lambda: 0",
        ),
    ],
)
def test_eval(a, b):
    assert eval(parse(a)) == parse(b)
