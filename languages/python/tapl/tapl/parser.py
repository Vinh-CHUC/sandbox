from dataclasses import field, dataclass
from pathlib import Path

from lark import Lark, Token
from lark.tree import Tree

GRAMMAR_P = Path(__file__).parent / Path("grammars/grammar.lark")
PARSER = Lark(Path.open(GRAMMAR_P))


@dataclass
class Info:
    pass


@dataclass
class TrueV:
    info: Info = field(default_factory=Info)


@dataclass
class FalseV:
    info: Info = field(default_factory=Info)


@dataclass
class Zero:
    info: Info = field(default_factory=Info)


@dataclass
class If:
    If: "Term"
    Then: "Term"
    Else: "Term"
    info: Info = field(default_factory=Info)


@dataclass
class Succ:
    term: "Term"
    info: Info = field(default_factory=Info)


@dataclass
class Pred:
    term: "Term"
    info: Info = field(default_factory=Info)


@dataclass
class IsZero:
    term: "Term"
    info: Info = field(default_factory=Info)


type Term = TrueV | FalseV | Zero | If | Succ | Pred | IsZero
type Value = Zero | Succ | TrueV | FalseV

def parse_str(s: str) -> Term:
    return parse(PARSER.parse(s))


def parse(t: Tree | Token) -> Term:
    match t:
        case Token(type="ZERO"):
            return Zero()

        case Token(value="true"):
            return TrueV()

        case Token(value="false"):
            return FalseV()

        case Tree(data=Token("RULE", "expression"), children=[_, subtree, _ ]):
            return parse(subtree)

        case Tree(
            data=Token("RULE", "if_expr"),
            children=[
                Token("IF", "if"), if_, Token("THEN", "then"), then_, Token("ELSE", "else"), else_
            ]
        ):
            return If(If=parse(if_), Then=parse(then_), Else=parse(else_))

        case Tree(data=Token("RULE", "succ_expr"), children=[Token("SUCC", "succ"), subtree]):
            return Succ(parse(subtree))

        case Tree(data=Token("RULE", "pred_expr"), children=[Token("PRED", "pred"), subtree]):
            return Pred(parse(subtree))

        case Tree(data=Token("RULE", "iszero_expr"), children=[Token("ISZERO", "iszero"), subtree]):
            return IsZero(parse(subtree))

        case _:
            raise ValueError()
