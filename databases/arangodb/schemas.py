from dataclasses import dataclass
from datetime import datetime
import random

from arango import ArangoClient, client, collection, database
from faker import Faker
from pydantic import BaseModel, Field
from typing import Any, Callable, Dict, List, Tuple, Union, TypeVar

from enum import auto, Enum, EnumType

T = TypeVar("T")

## Factory helpers
FAKE = Faker()
def mk_dict_fac(k_fac: Callable, v_fac: Callable) -> Callable[[], Dict[Any, Any]]:
    def inner():
        d = {}
        for _ in range(random.randint(1, 20)):
            d[k_fac()] = v_fac()
        return d
    return inner

def mk_list_fac(fac: Callable[[], T]) -> Callable[[], List[Any]]:
    def inner():
        l = []
        for _ in range(random.randint(1, 20)):
            l.append(fac())
        return l
    return inner

def mk_enum_fac(en: EnumType) -> Callable[[], Any]:
    return lambda: random.choice([e.value for e in en])

def mk_sum_fac(facs: List[Callable]) -> Callable[[], List[Any]]:
    return lambda: random.choice(facs)()

INT_FIELD = Field(default_factory=lambda: FAKE.pyint())
STR_FIELD = Field(default_factory=lambda: FAKE.pystr())
DT_FIELD = Field(default_factory=lambda: FAKE.date_time())

## Models
class Color(Enum):
    RED = "RED"
    BLUE = "BLUE"
    GREEN = "GREEN"

class City(Enum):
    PARIS = "PARIS"
    LONDON = "LONDON"

class ModelD(BaseModel):
    id: int
    color: Color

class ModelB(BaseModel):
    id: int = INT_FIELD
    color: Color = Field(default_factory=lambda: mk_enum_fac(Color)())

class ModelC(BaseModel):
    id: int = INT_FIELD
    color: City = Field(default_factory=lambda: mk_enum_fac(City)())

class ModelA(BaseModel):
    timestamp: datetime = DT_FIELD
    dimensions: Tuple[int, int] = Field(default_factory=lambda: (FAKE.pyint(), FAKE.pyint()))
    name: str = STR_FIELD
    mydict: Dict[int, str] = Field(default_factory=lambda: mk_dict_fac(FAKE.pyint, FAKE.pystr)())
    bees: List[ModelB] = Field(default_factory=lambda: mk_list_fac(ModelB)())
    beesorcees: List[Union[ModelB, ModelC]] = Field(default_factory=lambda: mk_list_fac(mk_sum_fac([ModelB, ModelC]))())

def bootstrap():
    client = ArangoClient(hosts="http://localhost:8529")
    sys_db = client.db("_system", username="root", password="openSesame")
    sys_db.create_database("pydantic")
    return client.db("pydantic", username="root", password="openSesame")
