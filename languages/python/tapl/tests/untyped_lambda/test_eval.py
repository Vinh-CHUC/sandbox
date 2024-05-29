from pathlib import Path

import pytest
from lark import exceptions, Lark

from tapl.untyped_lambda.eval import shift
from tapl.untyped_lambda.parser import parse


GRAMMAR_P = Path(__file__).parent.parent.parent / Path("tapl/untyped_lambda/grammars/grammar.lark")
PARSER = Lark(Path.open(GRAMMAR_P))

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
    ]
)
def test_shift(test_input, shift_by, shift_above, expected):
    term = parse(PARSER.parse(test_input))
    assert repr(shift(shift_by, shift_above, term)) == expected
