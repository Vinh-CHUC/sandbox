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

def get_data():
    data = []
    for line in (Path(__file__).parent / "_2_red_nosed_reports.dat").open().readlines():
        data.append([int(i) for i in line.strip().split(" ")])
    return data

# The tolerance here doesn't really work:
# if (el, ell) is fine as pair, it might still be the case that ell is the element to remove!!!
# def is_safe_inner(report: list[int], o: Order, tolerance: int) -> bool:
#     match report:
#         case [el, ell, elll, *rest] if within_bounds(el, ell) and order_respected(el, ell, o) and tolerance > 0:
#             return is_safe_inner([ell, *rest], o, tolerance - 1)
#         case [_, el ,ell, *rest] if within_bounds(el, ell) and order_respected(el, ell, o) and tolerance > 0:
#             return is_safe_inner([ell, *rest], o, tolerance - 1)
#         case [el ,ell, _, *rest] if within_bounds(el, ell) and order_respected(el, ell, o) and tolerance > 0:
#             return is_safe_inner([ell, *rest], o, tolerance - 1)
#         case [el, ell, *rest]:
#             return False
#         case [el, ell] if within_bounds(el, ell) and order_respected(el, ell, o):
#             return True
#         case [el]:
#             return True
#         case []:
#             return True
#         case _:
#             assert_never(report)

def is_safe_inner(report: list[int], o: Order) -> bool:
    match report:
        case [el, ell, *rest] if within_bounds(el, ell) and order_respected(el, ell, o):
            return is_safe_inner([ell, *rest], o)
        case [el, ell, *rest]:
            return False
        case [el]:
            return True
        case []:
            return True
        case _:
            assert_never(report)


def is_safe(report: list[int]) -> bool:
    return is_safe_inner(report, Order.INCR) or is_safe_inner(report, Order.DECR)

def is_safe_it(report: list[int], o: Order) -> bool:
    for i, j in zip(report[:-1], report[1:]):
        if not(within_bounds(i, j) and order_respected(i, j, o)):
            return False
    return True

def part1():
    reports = get_data()
    return sum(1 if is_safe(r) else 0 for r in reports)

def part1_it():
    reports = get_data()
    return sum(1 if is_safe_it(r, Order.INCR) or is_safe_it(r, Order.DECR) else 0 for r in reports)

def part2_brute_force():
    reports = get_data()
    ret = 0
    for r in reports:
        for idx in range(len(r)):
            if is_safe(r[:idx] + r[idx+1:]):
                ret = ret + 1
                break

    return ret

def is_safe_inner_2(report: list[int], o: Order, previous: int | None, skip_budget: int = 0) -> bool:
    match report:
        case [el, ell, *rest]:
            return (
                (
                    within_bounds(el, ell) and order_respected(el ,ell, o)
                    and is_safe_inner_2([ell, *rest], o, el)
                )
                or
                (
                    previous is not None and skip_budget > 0 and
                    within_bounds(previous, ell) and order_respected(previous ,ell, o)
                    and is_safe_inner_2([ell, *rest], o, el)
                )
            )
            return is_safe_inner([ell, *rest], o)
        case [el]:
            return True
        case []:
            return True
        case _:
            assert_never(report)

def is_safe_2(report: list[int]) -> bool:
    return is_safe_inner(report, Order.INCR) or is_safe_inner(report, Order.DECR)
