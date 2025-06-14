"""
Key takeways:
    1. The whole problem is about checking that a property holds for every pair made of consecutive
    elements in the input array
    2. That the property holds for every pair for the input array, while potentially removing one
    element:
        - The recursive approach is not trivial, skipping some element should not presume that this
          element meets any property, like already being part of a valid pair!
        - The problem is about skipping an element, not skipping a pair,
            e.g. 1 10 3, would require skipping two pairs but only one element
"""

from enum import auto, Enum
from pathlib import Path
from typing import assert_never


class Order(Enum):
    INCR = auto()
    DECR = auto()


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
        if not (within_bounds(i, j) and order_respected(i, j, o)):
            return False
    return True


def part1():
    reports = get_data()
    return sum(1 if is_safe(r) else 0 for r in reports)


def part1_it():
    reports = get_data()
    return sum(
        1 if is_safe_it(r, Order.INCR) or is_safe_it(r, Order.DECR) else 0
        for r in reports
    )


def part2_brute_force():
    reports = get_data()
    ret = 0
    # Complexity: n**2
    for r in reports:
        for idx in range(len(r)):
            if is_safe(r[:idx] + r[idx + 1 :]):
                ret = ret + 1
                if not is_safe_2(r):
                    print(r)
                break

    return ret


# An unfinished attempt art part2 which uses recursion
def is_safe_inner_2(
    report: list[int], o: Order, previous: int | None, skip_budget: int
) -> bool:
    # Complexity: n**2 / 2: as we skip an elemet further down, the beginning of the list work is
    # shared. No sharing past the skipping point though...
    # Would need full dynamic programming or memoisation
    match report:
        case [el, ell, *rest]:
            return (
                # Happy path
                (
                    within_bounds(el, ell)
                    and order_respected(el, ell, o)
                    and is_safe_inner_2([ell, *rest], o, el, skip_budget)
                )
                or
                # Skip el for the case of the very first element in the list
                (
                    previous is None
                    and skip_budget > 0
                    and is_safe_inner_2([ell, *rest], o, previous, skip_budget - 1)
                )
                # Skip ell
                or (
                    skip_budget > 0
                    and is_safe_inner_2([el, *rest], o, el, skip_budget - 1)
                )
            )
        case [el]:
            return True
        case []:
            return True
        case _:
            assert_never(report)


def is_safe_2(report: list[int]) -> bool:
    return is_safe_inner_2(report, Order.INCR, None, 1) or is_safe_inner_2(
        report, Order.DECR, None, 1
    )


def part2_rec():
    reports = get_data()
    return sum(1 if is_safe_2(r) else 0 for r in reports)
