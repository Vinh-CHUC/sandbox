from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict
# 2x - 3y

class Node(ABC):
    @abstractmethod
    def eval(self, env: Dict):
        pass

@dataclass
class Literal(Node):
    value: object

    def eval(self, _env: Dict) -> object:
        return self.value

@dataclass
class Variable(Node):
    name: str

    def eval(self, env: Dict[str, object]) -> object:
        assert self.name in env
        return env[self.name]

@dataclass
class Multiply(Node):
    left: Node
    right: Node

    def eval(self, env: Dict) -> object:
        return self.left.eval(env) * self.right.eval(env)

@dataclass
class Substract(Node):
    left: Node
    right: Node

    def eval(self, env: Dict) -> object:
        return self.left.eval(env) - self.right.eval(env)

# 2x - 3y
EXPR = Substract(
    left=Multiply(Literal(2), Variable("x")),
    right=Multiply(Literal(3), Variable("y"))
)

EXPR.eval({"x": 5, "y": 10})
