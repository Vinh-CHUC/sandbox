from enum import auto, Enum
from pathlib import Path
from typing import assert_never

class Order(Enum):
    INCR = auto()
    DECR = auto()

# This doesn't work as it tolerates up to 1 pair of neighbours that don't match the criteria
# But the ask is does it work if one **removes** one element
#
# 1 10 3  -> would require a tolerance of 2, but can work by only removing one element
#
# def is_safe_inner(report: list[int], o: Order, tolerance: int) -> bool:
#     match report:
#         case [el, ell, *rest] if abs(el - ell) >= 1 and abs(el - ell) <= 3:
#             match o:
#                 case Order.INCR if ell > el:
#                     return is_safe_inner([ell, *rest], o, tolerance) 
#                 case Order.DECR if ell < el:
#                     return is_safe_inner([ell, *rest], o, tolerance) 
#                 case _ if tolerance > 0:
#                     return is_safe_inner([ell, *rest], o, tolerance - 1) 
#                 case _:
#                     return False
#         case [el, ell, *rest]:
#             if tolerance > 0:
#                 return is_safe_inner([ell, *rest], o, tolerance - 1) 
#             return False
#         case [el]:
#             return True
#         case []:
#             return True
#         case _:
#             assert_never(report)

def within_bounds(el, ell):
    return abs(el - ell) >= 1 and abs(el - ell) <= 3

def order_respected(el, ell, o):
    match o:
        case Order.INCR if ell > el:
            return True
        case Order.DECR if ell < el:
            return True
        case _:
            return False

def is_safe_inner(report: list[int], o: Order, tolerance: int) -> bool:
    match report:
        case [el, ell, *rest] if within_bounds(el, ell) and order_respected(el, ell, o):
            return is_safe_inner([ell, *rest], o, tolerance)
        case [el, _, ell, *rest] if within_bounds(el, ell) and order_respected(el, ell, o) and tolerance > 0:
            return is_safe_inner([ell, *rest], o, tolerance - 1)
        case [_, el ,ell, *rest] if within_bounds(el, ell) and order_respected(el, ell, o) and tolerance > 0:
            return is_safe_inner([ell, *rest], o, tolerance - 1)
        case [el ,ell, _, *rest] if within_bounds(el, ell) and order_respected(el, ell, o) and tolerance > 0:
            return is_safe_inner([ell, *rest], o, tolerance - 1)
        case [el, ell, *rest]:
            return False
        case [el]:
            return True
        case []:
            return True
        case _:
            assert_never(report)


def is_safe(report: list[int], tolerance: int = 0) -> bool:
    return is_safe_inner(report, Order.INCR, tolerance) or is_safe_inner(report, Order.DECR, tolerance)

def get_data():
    data = []
    for line in (Path(__file__).parent / "_2_red_nosed_reports.dat").open().readlines():
        data.append([int(i) for i in line.strip().split(" ")])
    return data


def main():  # 314
    reports = get_data()
    return sum(1 if is_safe(r) else 0 for r in reports)

def main_part2():
    reports = get_data()
    return sum(1 if is_safe(r, tolerance=1) else 0 for r in reports)
