from dataclasses import dataclass, field

@dataclass
class ClassA:
    name: str = field(default_factory=lambda: "hello")
    qty: float = 5


a = ClassA()
print(a.qty)
