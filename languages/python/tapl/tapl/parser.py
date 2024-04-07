from pathlib import Path

from lark import Lark

Lark(Path.open(Path(__file__).parent / Path("grammar.lark")))
