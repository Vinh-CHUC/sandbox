from functools import reduce
from typing import Dict, List, Set


class SolutionIterative:
    def take_course(self, course_to_preqs: Dict[int, List[int]], course_idx: int):
        for c in course_to_preqs:
            if course_idx in course_to_preqs[c]:
                course_to_preqs[c] = [x for x in course_to_preqs[c] if x != course_idx]

        for c in [c for c in course_to_preqs if not course_to_preqs[c]]:
            del course_to_preqs[c]

    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        course_to_preqs: Dict[int, List[int]] = {}
        for course, preq in prerequisites:
            course_to_preqs.setdefault(course, []).append(preq)

        del prerequisites

        to_take: Set[int] = set(range(numCourses))
        taken = []

        while to_take:
            can_take = {c for c in to_take if c not in course_to_preqs}
            if can_take:
                for c in can_take:
                    to_take.remove(c)
                    taken.append(c)
                    self.take_course(course_to_preqs, c)
            else:
                break

        return taken if len(taken) == numCourses else []


Solution = SolutionIterative

assert Solution().findOrder(numCourses=2, prerequisites=[[1, 0]]) == [0, 1]


assert Solution().findOrder(
    numCourses=4, prerequisites=[[1, 0], [2, 0], [3, 1], [3, 2]]
) == [0, 1, 2, 3]
"""
    1: 0
    2: 0
    3: 1, 2
"""
assert Solution().findOrder(numCourses=1, prerequisites=[]) == [0]
assert Solution().findOrder(3, [[1, 0], [1, 2], [0, 1]]) == []


class SolutionRec:
    def take_course(
        self, course_to_preqs: Dict[int, List[int]], course_idx: int
    ) -> Dict[int, List[int]]:
        for c in course_to_preqs:
            if course_idx in course_to_preqs[c]:
                course_to_preqs[c] = [x for x in course_to_preqs[c] if x != course_idx]

        for c in [c for c in course_to_preqs if not course_to_preqs[c]]:
            del course_to_preqs[c]

        return course_to_preqs

    def do_findOrder(
        self, taken: List[int], to_take: Set[int], course_to_preqs: Dict[int, List[int]]
    ) -> List[int]:
        if not to_take:
            return taken

        can_take = {c for c in to_take if c not in course_to_preqs}
        if can_take:
            return self.do_findOrder(
                taken + list(can_take),
                to_take.difference(can_take),
                reduce(
                    lambda c_to_p, c: self.take_course(c_to_p, c),
                    can_take,
                    course_to_preqs,
                ),
            )
        else:
            return []

    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        course_to_preqs: Dict[int, List[int]] = {}
        for course, preq in prerequisites:
            course_to_preqs.setdefault(course, []).append(preq)

        del prerequisites

        to_take: Set[int] = set(range(numCourses))
        taken = []

        return self.do_findOrder(taken, to_take, course_to_preqs)


Solution = SolutionRec

assert Solution().findOrder(numCourses=2, prerequisites=[[1, 0]]) == [0, 1]


assert Solution().findOrder(
    numCourses=4, prerequisites=[[1, 0], [2, 0], [3, 1], [3, 2]]
) == [0, 1, 2, 3]
"""
    1: 0
    2: 0
    3: 1, 2
"""
assert Solution().findOrder(numCourses=1, prerequisites=[]) == [0]
assert Solution().findOrder(3, [[1, 0], [1, 2], [0, 1]]) == []
