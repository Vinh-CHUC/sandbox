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


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("lambda: lambda: lambda: 0 1 2", "(lambda: (lambda: (lambda: ((0 1) 2))))"),
    ]
)
def test_abstractions(test_input, expected):
    assert repr(parse(PARSER.parse(test_input))) == expected

class TestParser:
    @pytest.mark.parametrize(
        "test_input,expected",
        [
            # Abstraction has precedence over application
            # Another interpretation could have been (lambda: 0) (lambda: 0)
            ("lambda: 0 lambda: 0", "(lambda: (0 (lambda: 0)))")
        ]
    )
    def test_precedence(self, test_input, expected):
        assert repr(parse(PARSER.parse(test_input))) == expected
