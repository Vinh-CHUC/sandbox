import pytest
from hypothesis import event, given
from hypothesis.extra.lark import from_lark

from tapl.untyped_lambda import names, parser


@pytest.mark.slow
@given(
    from_lark(parser.PARSER, start="abstraction")
    .map(parser.parse)
    .map(lambda t: names.fix_integers(depth=0, t=t))
)
def test_add_remove_names(t: parser.Term[int]):
    event(str(t))
    assert names.remove_names([], names.add_names(-1, t)) == t

def test_add_remove_names_2():
    t = parser.parse("(lambda: (lambda: (lambda: (1 (1 0)))))")
    assert names.remove_names([], names.add_names(-1, t)) == t
