from dataclasses import dataclass
from enum import Enum
from typing import Literal

from lark.tree import Tree

@dataclass
class Info:
    pass

@dataclass
class TrueV:
    info: Info

@dataclass
class FalseV:
    info: Info

@dataclass
class Zero:
    info: Info

@dataclass
class If:
    If: "Term"
    Then: "Term"
    Else: "Term"

@dataclass
class Succ:
    term: "Term"

@dataclass
class Pred:
    term: "Term"

@dataclass
class IsZero:
    term: "Term"


type Term = TrueV | FalseV | Zero | If | Succ | Pred | IsZero
    

def eval(t: Tree) -> None
