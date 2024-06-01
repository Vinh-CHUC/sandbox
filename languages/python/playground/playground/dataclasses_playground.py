from dataclasses import dataclass, field

@dataclass
class ClassA:
    name: str = field(default_factory=lambda: "hello")
    qty: float = 5

@dataclass
class TemplateDC[T]:
    id: T


def adder[T](a: T) -> T:
    return TemplateDC(id=a).id

x = adder("fku")

a = ClassA()
print(a.qty)
