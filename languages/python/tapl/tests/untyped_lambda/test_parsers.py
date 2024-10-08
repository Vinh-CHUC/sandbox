import pytest

from tapl.untyped_lambda.parser import parse


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("0 1 2 3", "(((0 1) 2) 3)"),  # Left associative
        ("0 1 (2 3)", "((0 1) (2 3))"),  # Respects parenthesis
        ("0 (1 2 3)", "(0 ((1 2) 3))")  # Respects parenthesis
    ]
)
def test_applications(test_input, expected):
    assert repr(parse(test_input)) == expected


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("lambda: lambda: lambda: 0 1 2", "(lambda: (lambda: (lambda: ((0 1) 2))))"),
    ]
)
def test_abstractions(test_input, expected):
    assert repr(parse(test_input)) == expected

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
        assert repr(parse(test_input)) == expected

    @pytest.mark.parametrize(
        "test_input,expected",
        [
            (
                "lambda: lambda: (lambda: lambda:3 2 1 0) (lambda: 0)",
                "(lambda: (lambda: ((lambda: (lambda: (((3 2) 1) 0))) (lambda: 0))))"
            ),
            (
                "lambda: lambda: (lambda: (lambda: 1) 0) lambda: 2 1 0",
                "(lambda: (lambda: ((((lambda: ((lambda: 1) 0)) (lambda: 2)) 1) 0)))"
            ),
            (
                "lambda: lambda: (lambda: (lambda: 1) 0) (lambda: 2 1 0)",
                "(lambda: (lambda: ((lambda: ((lambda: 1) 0)) (lambda: ((2 1) 0)))))"
            ),
        ]
    )
    def test_complex_use_cases(self, test_input, expected):
        assert repr(parse(test_input)) == expected
