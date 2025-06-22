from dataclasses import dataclass
from pathlib import Path

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


class FileBlock:
    begin: int
    end_incl: int
    file_id: int

    def __init__(self, end_incl: int, fs: "SparseFS"):
        if end_incl <= 0:
            raise RuntimeError

        assert fs.data[end_incl] != FREE_SPACE

        file_id = fs.data[end_incl]
        curr = end_incl
        while curr >= 0 and fs.data[curr] == file_id:
            curr -= 1
        self.begin, self.end_incl = curr + 1, end_incl
        self.file_id = int(file_id)

    def size(self) -> int:
        return self.end_incl - self.begin + 1

    def blank(self, fs: "SparseFS"):
        for idx in range(self.begin, self.end_incl + 1):
            fs.data[idx] = FREE_SPACE

    def __repr__(self):
        return f"#{self.file_id}, [{self.begin}, {self.end_incl}]"

    def __str__(self):
        return repr(self)


class FreeBlock:
    begin: int
    end_incl: int

    def __init__(self, begin: int, fs: "SparseFS"):
        if begin >= len(fs.data):
            raise RuntimeError
        assert fs.data[begin] == FREE_SPACE

        curr = begin
        while curr < len(fs.data) and fs.data[curr] == FREE_SPACE:
            curr += 1
        self.begin, self.end_incl = begin, curr - 1

    def size(self) -> int:
        return self.end_incl - self.begin + 1

    def write(self, file_block: FileBlock, fs: "SparseFS"):
        assert file_block.size() <= self.size()
        for idx in range(self.begin, self.begin + file_block.size()):
            fs.data[idx] = str(file_block.file_id)

    def __repr__(self):
        return f"[{self.begin}, {self.end_incl}]"

    def __str__(self):
        return repr(self)


@dataclass
class SparseFS:
    data: list[str]

    # Illegal to call this if the file has been defragmented
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

                if (
                    curr < len(self.data)
                    and curr != file_begin
                    and self.data[curr] != FREE_SPACE
                ):
                    dense.append(0)

        return DenseFS(dense)

    def seek_next_free_space(self, idx: int) -> int:
        if self.data[idx] != FREE_SPACE:
            while idx < len(self.data) and self.data[idx] != FREE_SPACE:
                idx += 1
        else:
            return idx
        return idx

    def seek_prev_file_block(self, idx: int) -> int:
        if self.data[idx] == FREE_SPACE:
            while idx >= 0 and self.data[idx] == FREE_SPACE:
                idx -= 1
        else:
            return idx
        return idx

    def defragment(self):
        free_space_idx = self.seek_next_free_space(0)
        file_block_idx = self.seek_prev_file_block(len(self.data) - 1)
        while free_space_idx < file_block_idx:
            self.data[free_space_idx] = self.data[file_block_idx]
            self.data[file_block_idx] = FREE_SPACE
            free_space_idx = self.seek_next_free_space(free_space_idx + 1)
            file_block_idx = self.seek_prev_file_block(file_block_idx - 1)

    def defragment_whole(self):
        file_block = (
            FileBlock(idx, self)
            if (idx := self.seek_prev_file_block(len(self.data) - 1)) >= 0
            else None
        )

        while file_block is not None:
            print(file_block)
            file_id = file_block.file_id

            free_block = (
                FreeBlock(idx, self)
                if (idx := self.seek_next_free_space(0)) < len(self.data)
                else None
            )

            while free_block is not None and free_block.begin < file_block.begin:
                if free_block.size() >= file_block.size():
                    free_block.write(file_block, self)
                    file_block.blank(self)
                    break
                free_block = (
                    FreeBlock(idx, self)
                    if (idx := self.seek_next_free_space(free_block.end_incl + 1))
                    < len(self.data)
                    else None
                )

            # We have to make sure to skip already processed files!
            file_block = (
                FileBlock(idx, self)
                if (idx := self.seek_prev_file_block(file_block.begin - 1)) >= 0
                else None
            )
            while file_block is not None and file_block.file_id >= file_id:
                file_block = (
                    FileBlock(idx, self)
                    if (idx := self.seek_prev_file_block(file_block.begin - 1)) >= 0
                    else None
                )

    def checksum(self):
        return sum(
            idx * int(val) for idx, val in enumerate(self.data) if val != FREE_SPACE
        )


def get_data() -> DenseFS:
    return DenseFS(
        [
            int(x)
            for x in (Path(__file__).parent / "_9_disk_fragmenter.dat")
            .open()
            .read()
            .strip()
        ]
    )


def part1():
    fs = get_data().toSparse()
    fs.defragment()
    return fs.checksum()


def part2():
    fs = get_data().toSparse()
    fs.defragment_whole()
    return fs.checksum()
