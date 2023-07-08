from typing import List

from numpy import who


class SolutionRecFromTheEnd:
    def do_merge(self, merged: List[List[int]], intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return merged
        else:
            """
            By construction (sorting in self.merge())
            inter[0] <= merged[-1]

            post-condition:
                either inter[0] overlaps with merge[-1] => merge it
                doesn't => append it
            """
            inter = intervals.pop()
            if not merged:
                return self.do_merge([inter], intervals)
            else:
                if inter[1] >= merged[-1][0]:
                    a = merged.pop()
                    merged.append([inter[0], max(inter[1], a[1])])
                    return self.do_merge(merged, intervals)
                else:
                    return self.do_merge(merged + [inter], intervals)

    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        """
        sorted intervals by beginning:
        -------------
          --------------
             ---------
                           --------------
        """
        intervals = sorted(intervals, key=lambda x: x[0])
        return list(reversed(self.do_merge([], intervals)))


Solution = SolutionRecFromTheEnd

assert Solution().merge([[1, 3], [2, 6], [8, 10], [15, 18]]) == [
    [1, 6],
    [8, 10],
    [15, 18],
]

assert Solution().merge([[1, 4], [4, 5]]) == [[1, 5]]
