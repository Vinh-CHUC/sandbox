from enum import auto, Enum
from pathlib import Path
from typing import assert_never

class Order(Enum):
    INCR = auto()
    DECR = auto()

def is_safe_inner(report: list[int], o: Order, tolerance: int) -> bool:
    match report:
        case [el, ell, *rest] if abs(el - ell) >= 1 and abs(el - ell) <= 3:
            match o:
                case Order.INCR if ell > el:
                    return is_safe_inner([ell, *rest], o, tolerance) 
                case Order.DECR if ell < el:
                    return is_safe_inner([ell, *rest], o, tolerance) 
                case _ if tolerance > 0:
                    return is_safe_inner([ell, *rest], o, tolerance - 1) 
                case _:
                    return False
        case [el, ell, *rest]:
            if tolerance > 0:
                return is_safe_inner([ell, *rest], o, tolerance - 1) 
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
