from pydantic import BaseModel


class Response[T](BaseModel):
    data: T


def test():
    r = Response[str](data=5)
    r.model_dump_json()
    s = Response(data=5)
    s.model_dump_json()
