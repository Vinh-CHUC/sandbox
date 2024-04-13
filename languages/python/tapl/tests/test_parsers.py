from pathlib import Path

import pytest
from lark import exceptions, Lark

from tapl.parser import parse


GRAMMAR_P = Path(__file__).parent.parent / Path("tapl/grammars/grammar.lark")
PARSER = Lark(Path.open(GRAMMAR_P))


class TestUntypedArithmetic:
    def test_boolean_expressions(self):
        with pytest.raises(exceptions.LarkError):
            PARSER.parse("yo") 

        with pytest.raises(exceptions.LarkError):
            PARSER.parse("if true then True else false")

        with pytest.raises(exceptions.LarkError):
            PARSER.parse("")

        parse(PARSER.parse("if true then true else false"))
        parse(PARSER.parse("(if true then true else false)"))
        parse(PARSER.parse("(true)"))
        parse(PARSER.parse("if true then false else false"))
        parse(PARSER.parse('''
            if true then
                if true then true else false 
            else false
        '''))
        parse(PARSER.parse('''
            if true then
                (if true then true else false)
            else false
        '''))

    def test_arith_expressions(self):
        with pytest.raises(exceptions.LarkError):
            PARSER.parse("5") 

        with pytest.raises(exceptions.LarkError):
            PARSER.parse("2 + 3")

        with pytest.raises(exceptions.LarkError):
            PARSER.parse("succc 5")

        with pytest.raises(exceptions.LarkError):
            PARSER.parse("-5")

        with pytest.raises(exceptions.LarkError):
            PARSER.parse("if true then succ (succ 2) else false")

        parse(PARSER.parse("if true then succ 0 else false"))
        parse(PARSER.parse("if true then succ succ 0 else false"))
        parse(PARSER.parse("if true then succ (succ 0) else iszero false"))
        parse(PARSER.parse("0"))
        parse(PARSER.parse("pred if true then 0 else succ 0"))
        parse(PARSER.parse("pred (if true then 0 else succ 0)"))
