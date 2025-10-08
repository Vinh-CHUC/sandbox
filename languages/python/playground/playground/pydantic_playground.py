from pydantic import BaseModel


class A(BaseModel):
    data: str = "foo"

class B(BaseModel):
    data: str = "bar"

class C(BaseModel):
    underlying: A | B = B()

class D(BaseModel):
    data: str = "foo"

class E(BaseModel):
    val: str = "bar"

class F(BaseModel):
    underlying: D | E = E()
