from typing import List, Tuple


COORD = Tuple[int, int]


def print_grid(grid: List[List[str]]):
    print("---")
    for i in range(len(grid)):
        print(grid[i])


class Solution:
    def collect_dfs_coords(self, grid: List[List[str]], coord: COORD):
        grid[coord[0]][coord[1]] = "0"

        valid_neighours = [
            c for c in
            [
                (coord[0], coord[1] - 1),
                (coord[0], coord[1] + 1),
                (coord[0] - 1, coord[1]),
                (coord[0] + 1, coord[1])
            ]
            if (
                c[0] > -1
                and c[0] < len(grid)
                and c[1] > -1
                and c[1] < len(grid[0])
                and grid[c[0]][c[1]] == "1"
            )
        ]

        for n in valid_neighours:
            self.collect_dfs_coords(grid, n)

    def numIslands(self, grid: List[List[str]]) -> int:
        islands_count = 0

        for i in range(len(grid)):
            for j in range(len(grid[0])):
                if grid[i][j] == "1":
                    islands_count += 1
                    self.collect_dfs_coords(grid, (i, j))

        return islands_count


assert (
    Solution().numIslands(
        [
            ["1", "1", "1", "1", "0"],
            ["1", "1", "0", "1", "0"],
            ["1", "1", "0", "0", "0"],
            ["0", "0", "0", "0", "0"],
        ]
    )
    == 1
)

assert (
    Solution().numIslands(
        [
            ["1", "1", "0", "0", "0"],
            ["1", "1", "0", "0", "0"],
            ["0", "0", "1", "0", "0"],
            ["0", "0", "0", "1", "1"],
        ]
    )
    == 3
)
