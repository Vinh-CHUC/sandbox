from collections import Counter
from pathlib import Path


def get_data():
    left_idxs, right_idxs = [], []
    for line in (
        (Path(__file__).parent / "_1_historian_hysteria.dat").open().readlines()
    ):
        left, right = line.strip().split("  ")
        left_idxs.append(int(left))
        right_idxs.append(int(right))
    return left_idxs, right_idxs


def main_part1():
    left_idxs, right_idxs = get_data()
    left_idxs = sorted(left_idxs)
    right_idxs = sorted(right_idxs)
    return sum(abs(l - r) for l, r in zip(left_idxs, right_idxs))


def main_part2():
    left_idxs, right_idxs = get_data()
    right_counter = Counter(right_idxs)
    return sum(l * right_counter[l] if l in right_counter else 0 for l in left_idxs)
