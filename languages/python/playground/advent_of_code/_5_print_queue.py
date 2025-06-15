from collections import defaultdict
from dataclasses import dataclass
from functools import cmp_to_key
from itertools import chain
from math import floor
from pathlib import Path


@dataclass
class OrderingRule:
    a: int
    b: int

    def __repr__(self):
        return f"{self.a}|{self.b}"


@dataclass
class Update:
    pages: list[int]

    def __repr__(self):
        return f"pages: {repr(self.pages)}"


def get_data(test_data: bool = False) -> tuple[list[OrderingRule], list[Update]]:
    if not test_data:
        lines = (Path(__file__).parent / "_5_print_queue.dat").read_text().splitlines()
    else:
        lines = (
            (Path(__file__).parent / "_5_print_queue.test.dat").read_text().splitlines()
        )

    ordering_rules = []
    updates = []
    for l in lines:
        if "|" in l:
            a, b = l.split("|")
            ordering_rules.append(OrderingRule(int(a), int(b)))

        if "," in l:
            updates.append(Update([int(i) for i in l.split(",")]))

    return ordering_rules, updates


def valid(update: Update, rules_by_val: dict[int, list[OrderingRule]]) -> bool:
    for idx, val in enumerate(update.pages):
        rules = rules_by_val.get(val, [])

        for r in rules:
            if val == r.a:
                if r.b in update.pages:
                    if update.pages.index(r.b) < idx:
                        return False

            if val == r.b:
                if r.a in update.pages:
                    if update.pages.index(r.a) > idx:
                        return False

    return True


def part1(test_data: bool = False):
    rules, updates = get_data(test_data)

    rules_by_values = defaultdict(list)
    for r in rules:
        rules_by_values[r.a].append(r)
        rules_by_values[r.b].append(r)

    valid_updates = [up for up in updates if valid(up, rules_by_values)]

    return sum(up.pages[floor(len(up.pages) / 2)] for up in valid_updates)


def cmp(a, b, rules: list[OrderingRule]):
    for r in rules:
        if [r.a, r.b] == [a, b]:
            return -1
        elif [r.b, r.a] == [a, b]:
            return 1
    return 0


def fix_update(update: Update, all_rules: list[OrderingRule]):
    relevant_rules = [
        r for r in all_rules if r.a in update.pages and r.b in update.pages
    ]
    update.pages.sort(key=cmp_to_key(lambda a, b: cmp(a, b, relevant_rules)))


def part2(test_data: bool = False):
    rules, updates = get_data(test_data)

    rules_by_values = defaultdict(list)
    for r in rules:
        rules_by_values[r.a].append(r)
        rules_by_values[r.b].append(r)

    invalid_updates = [up for up in updates if not valid(up, rules_by_values)]

    for up in invalid_updates:
        fix_update(up, rules)

    return sum(up.pages[floor(len(up.pages) / 2)] for up in invalid_updates)
