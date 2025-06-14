from advent_of_code._2_red_nosed_reports import (
    part1,
    part1_it,
    part2_brute_force,
    part2_rec,
)


def test_part1():
    assert part1() == 314
    assert part1_it() == 314


def test_part2():
    assert part2_brute_force() == 373
    assert part2_rec() == 373
