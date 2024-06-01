from abc import abstractmethod
from dataclasses import field, dataclass
from pathlib import Path

from lark import Lark, Token
from lark.tree import Tree

GRAMMAR_P = Path(__file__).parent / Path("grammars/grammar.lark")
PARSER = Lark(Path.open(GRAMMAR_P))

@dataclass
class Variable[T]:
    index: T

    def __repr__(self) -> str:
        return str(self.index)

@dataclass
class Abstraction[T]:
    term: "Term[T]"
    name: str | None = None  # T == int <==> name == None

    def __repr__(self) -> str:
        if self.name is None:
            return "(lambda: " + repr(self.term) + ")"
        else:
            return f"(lambda {self.name}: " + repr(self.term) + ")"

@dataclass
class Application[T]:
    abstraction: "Term[T]"
    operand: "Term[T]"

    def __repr__(self) -> str:
        return "(" + repr(self.abstraction) + " " + repr(self.operand) + ")"


type Term[T] = Variable[T] | Abstraction | Application

def parse(t: Tree | Token | str) -> Term[int]:
    match t:
        case Tree(data=Token("RULE", "paren_term"), children=[_, subtree, _ ]):
            return parse(subtree)
        case Tree(data=Token("RULE", "variable"), children=[Token(type="INTEGER", value=val)]):
            return Variable[int](index=int(val))
        case Tree(data=Token("RULE", "application"), children=[child1, child2]):
            return Application(abstraction=parse(child1), operand=parse(child2))
        case Tree(data=Token("RULE", "abstraction"), children=[_, child]):
            return Abstraction(term=parse(child))
        case Token():
            raise NotImplementedError
        case str() as t:
            return parse(PARSER.parse(t))
        case _:
            raise NotImplementedError
