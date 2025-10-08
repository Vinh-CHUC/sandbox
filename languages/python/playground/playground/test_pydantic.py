from os import wait
from playground.pydantic_playground import A, B, C, D, E, F

"""
Pydantic arbitrarily selects the first member of the type union
if there is an ambiguity
"""
def test_union_fields_ambiguity():
    c = C()
    c_json = c.model_dump_json()
    c2 = C.model_validate_json(c_json)
    assert type(c2.underlying) is A


def test_union_fields_no_ambiguity():
    f = F()
    f_json = f.model_dump_json()
    f2 = F.model_validate_json(f_json)
    assert type(f2.underlying) is E

    f = F(underlying=D())
    f_json = f.model_dump_json()
    f2 = F.model_validate_json(f_json)
    assert type(f2.underlying) is D
