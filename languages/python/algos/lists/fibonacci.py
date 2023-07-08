class Solution:
    def fib(self, n: int) -> int:
        if n == 0:
            return 0
        if n == 1:
            return 1
        else:
            return self.do_fib(1, 0, 2, n)

    def do_fib(self, prev, p_prev, curr_n, desired_n):
        if curr_n == desired_n:
            return prev + p_prev
        else:
            return self.do_fib(prev + p_prev, prev, curr_n + 1, desired_n)


class SolutionLoopy:
    def fib(self, n: int) -> int:
        if n == 0:
            return 0
        if n == 1:
            return 1

        ret = 1
        fib_n_2 = 0
        fib_n_1 = 1
        for _ in range(2, n + 1):
            ret = fib_n_1 + fib_n_2
            fib_n_1, fib_n_2 = ret, fib_n_1

        return ret
