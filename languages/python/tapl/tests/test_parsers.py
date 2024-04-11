from pathlib import Path

import pytest

from lark import exceptions, Lark

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

        PARSER.parse("if true then true else false")
        PARSER.parse("(if true then true else false)")
        PARSER.parse("(true)")
        PARSER.parse("if true then false else false")
        PARSER.parse('''
            if true then
                if true then true else false 
            else false
        ''')
        PARSER.parse('''
            if true then
                (if true then true else false)
            else false
        ''')

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

        PARSER.parse("if true then succ 0 else false")
        PARSER.parse("if true then succ succ 0 else false")
        PARSER.parse("if true then succ (succ 0) else iszero false")
        PARSER.parse("0")
        PARSER.parse("pred if true then 0 else succ 0")
        PARSER.parse("pred (if true then 0 else succ 0)")
