from dataclasses import dataclass
from pathlib import Path
from typing import NewType

FREE_SPACE = "."


@dataclass
class DenseFS:
    data: list[int]

    def toSparse(self) -> "SparseFS":
        sparse = []
        for idx, val in enumerate(self.data):
            if idx % 2 == 0:
                sparse.extend([str(int(idx / 2))] * val)
            else:
                sparse.extend([FREE_SPACE] * val)
        return SparseFS(sparse)


@dataclass
class SparseFS:
    data: list[str]

    def toDense(self) -> DenseFS:
        dense = []

        curr = 0
        while curr < len(self.data):
            if self.data[curr] == FREE_SPACE:
                free_space_begin = curr
                while curr < len(self.data) and self.data[curr] == FREE_SPACE:
                    curr += 1
                dense.append(curr - free_space_begin)
            else:
                current_char = self.data[curr]
                file_begin = curr

                while curr < len(self.data) and self.data[curr] == current_char:
                    curr += 1
                dense.append(curr - file_begin)

                if curr < len(self.data) and curr != file_begin and self.data[curr] != FREE_SPACE:
                    dense.append(0)

        return DenseFS(dense)

    def seek_next_free_space(self, idx: int) -> int:
        if self.data[idx] != FREE_SPACE:
            while (idx < len(self.data) and self.data[idx] != FREE_SPACE):
                idx +=  1
        else:
            return idx
        return idx

    def seek_prev_file_block(self, idx: int) -> int:
        if self.data[idx] == FREE_SPACE:
            while (idx >= 0 and self.data[idx] == FREE_SPACE):
                idx -=  1
        else:
            return idx
        return idx

    def defragment(self):
        free_space_idx = 0
        file_block_idx = len(self.data) - 1
        while free_space_idx < file_block_idx:
            free_space_idx = self.seek_next_free_space(free_space_idx)
            file_block_idx = self.seek_prev_file_block(file_block_idx)
            self.data[free_space_idx] = self.data[file_block_idx]
            self.data[file_block_idx] = FREE_SPACE
            free_space_idx += 1
            file_block_idx -= 1

    def checksum(self):
        return sum(
            idx * int(val) for idx, val in enumerate(self.data) if val != FREE_SPACE
        )


def get_data() -> DenseFS:
    return DenseFS([
        int(x) for x in (Path(__file__).parent / "_9_disk_fragmenter.dat").open().read().strip()
])

def part1():
    fs = get_data().toSparse()
    fs.defragment()
    return fs.checksum()
