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
        return SparseFS("".join(sparse))


@dataclass
class SparseFS:
    data: str

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


def get_data() -> DenseFS:
    return DenseFS([
        int(x) for x in (Path(__file__).parent / "_9_disk_fragmenter.dat").open().read().strip()
])
