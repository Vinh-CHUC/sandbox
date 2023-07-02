from dataclasses import dataclass
from itertools import chain
from typing import Dict, List
VALID = ["((()))", "(()())", "(())()", "()(())", "()()()"]
INVALID = ["())", ")", "((((", "(((())))))"]

PAR_TO_INT: Dict[str, int] = {"(": 1, ")": -1}


def is_valid(par_s: str) -> bool:
    curr = 0

    for i in range(len(par_s)):
        curr = curr + PAR_TO_INT[par_s[i]]
        if curr < 0:
            return False

    return curr == 0


assert all(is_valid(x) for x in VALID)
assert all(not is_valid(x) for x in INVALID)


#################


class SolutionBackTrackingRecursive:
    def do_generateParenthesis(self, curr: str, score: int) -> List[str]:
        """
        Receives a curr that has a score >= 0
        """
        match (len(curr), score):
            case (_, 0) if len(curr) == 2 * self.n:
                return [curr]
            case (_, _) if len(curr) == 2 * self.n:
                return []
            case (_, _):
                return (
                    self.do_generateParenthesis(curr + "(", score + 1)
                    + (
                        self.do_generateParenthesis(curr + ")", score - 1) if score >= 1 else []
                    )
                )

    def generateParenthesis(self, n: int) -> List[str]:
        self.n = n
        return self.do_generateParenthesis("", 0)


Solution = SolutionBackTrackingRecursive
assert set(Solution().generateParenthesis(3)) == set(
    ["((()))", "(()())", "(())()", "()(())", "()()()"]
)

#################


@dataclass
class NodeAndScore:
    string: str
    score: int


class SolutionBackTrackingIterative:
    def generateParenthesis(self, n: int) -> List[str]:
        combs_to_try: List[NodeAndScore] = []
        combs_to_try.append(NodeAndScore(string="", score=0))

        ret = []

        while combs_to_try:
            comb = combs_to_try.pop()
            match comb:
                case NodeAndScore(string=string, score=0) if len(string) == 2 * n:
                    ret.append(string)
                case NodeAndScore(string=string, score=_) if len(string) == 2 * n:
                    pass
                case NodeAndScore(string=string, score=score):
                    combs_to_try.extend(
                        [NodeAndScore(string + "(", score + 1)]
                        + (
                            [NodeAndScore(string + ")", score - 1)]
                            if score >= 1 else []
                        )
                    )
        return ret


Solution = SolutionBackTrackingIterative
assert set(Solution().generateParenthesis(3)) == set(
    ["((()))", "(()())", "(())()", "()(())", "()()()"]
)

#################


class SolutionRecursive:
    def generateParenthesis(self, n: int) -> List[str]:
        if n == 1:
            return ["()"]
        else:
            subsolution = self.generateParenthesis(n - 1)
            solutions = [
                ["()" + s, "(" + s + ")", s + "()"]
                for s in subsolution
            ]
            return [x for subl in solutions for x in subl]


Solution = SolutionRecursive
assert set(Solution().generateParenthesis(3)) == set(
    ["((()))", "(()())", "(())()", "()(())", "()()()"]
)

#################


class SolutionIterative:
    def generateParenthesis(self, n: int) -> List[str]:
        solutions: List[str] = []
        for size in range(1, n + 1):
            if size == 1:
                solutions.append("()")
            else:
                solutions = list(chain(*[
                    ["()" + s, "(" + s + ")", s + "()"]
                    for s in solutions
                ]))
        return solutions


Solution = SolutionIterative
assert set(Solution().generateParenthesis(3)) == set(
    ["((()))", "(()())", "(())()", "()(())", "()()()"]
)
