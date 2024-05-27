from pathlib import Path

import pytest
from lark import exceptions, Lark

from tapl.untyped_lambda.parser import parse


GRAMMAR_P = Path(__file__).parent.parent.parent / Path("tapl/untyped_lambda/grammars/grammar.lark")
PARSER = Lark(Path.open(GRAMMAR_P))


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("0 1 2 3", "(((0 1) 2) 3)"),  # Left associative
        ("0 1 (2 3)", "((0 1) (2 3))"),  # Respects parenthesis
        ("0 (1 2 3)", "(0 ((1 2) 3))")  # Respects parenthesis
    ]
)
def test_applications(test_input, expected):
    assert repr(parse(PARSER.parse(test_input))) == expected

