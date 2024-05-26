import pytest

from tapl.untyped_arithmetic.parser import parse_str
from tapl.untyped_arithmetic.eval import NoRulesApply, isnumericalval, isval, ss_eval, eval


def test_isval():
    assert isval(parse_str("succ succ 0"))
    assert isval(parse_str("true"))
    assert not isval(parse_str("if true then true else false"))


def test_isnumericalval():
    assert isnumericalval(parse_str("succ succ 0"))
    assert not isnumericalval(parse_str("true"))
    assert not isnumericalval(parse_str("if true then true else false"))


class TestSSEval:
    def test_cant_ss_values(self):
        with pytest.raises(NoRulesApply):
            ss_eval(parse_str("true"))

        with pytest.raises(NoRulesApply):
            ss_eval(parse_str("succ succ 0"))

    def test_ifs(self):
        assert ss_eval(parse_str("if true then true else false")) == parse_str("true")
        assert ss_eval(parse_str("if true then (succ 0) else false")) == parse_str(
            "succ 0"
        )
        assert ss_eval(parse_str("if false then (succ 0) else false")) == parse_str(
            "false"
        )

        assert ss_eval(
            parse_str("if (iszero 0) then (succ 0) else false")
        ) == parse_str("if true then succ 0 else false")

    def test_numerics(self):
        assert ss_eval(parse_str("pred succ succ 0")) == parse_str("succ 0")


def test_eval():
    assert eval(
        parse_str("if (iszero 0) then (pred succ succ 0) else false")
    ) == parse_str("succ 0")
    assert eval(
        parse_str("succ succ succ succ 0")
    ) == parse_str("succ succ succ succ 0")
