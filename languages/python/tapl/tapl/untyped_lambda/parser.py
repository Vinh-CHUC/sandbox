from abc import abstractmethod
from dataclasses import field, dataclass
from pathlib import Path

from lark import Lark, Token
from lark.tree import Tree

GRAMMAR_P = Path(__file__).parent / Path("grammars/grammar.lark")
PARSER = Lark(Path.open(GRAMMAR_P))

@dataclass
class Variable:
    index: int

    def __repr__(self) -> str:
        return str(self.index)

@dataclass
class Abstraction:
    term: "Term"

    def __repr__(self) -> str:
        return "(lambda: " + repr(self.term) + ")"

@dataclass
class Application:
    abstraction: "Term"
    operand: "Term"

    def __repr__(self) -> str:
        return "(" + repr(self.abstraction) + " " + repr(self.operand) + ")"


type Term = Variable | Abstraction | Application

def parse(t: Tree | Token) -> Term:
    match t:
        case Tree(data=Token("RULE", "paren_term"), children=[_, subtree, _ ]):
            return parse(subtree)
        case Tree(data=Token("RULE", "variable"), children=[Token(type="INTEGER", value=val)]):
            return Variable(index=int(val))
        case Tree(data=Token("RULE", "application"), children=[child1, child2]):
            return Application(abstraction=parse(child1), operand=parse(child2))
        case _:
            raise NotImplementedError
