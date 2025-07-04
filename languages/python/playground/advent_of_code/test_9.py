from advent_of_code._9_disk_fragmenter import DenseFS, SparseFS, part1, part2


def test_densefs():
    assert DenseFS([int(s) for s in "12345"]).toSparse().data == list("0..111....22222")

    assert DenseFS([int(s) for s in "2333133121414131402"]).toSparse().data == list(
        "00...111...2...333.44.5555.6666.777.888899"
    )


def test_sparsefs():
    assert SparseFS(list("0..111....22222")).toDense().data == [int(s) for s in "12345"]
    assert SparseFS(
        list("00...111...2...333.44.5555.6666.777.888899")
    ).toDense().data == [int(s) for s in "2333133121414131402"]


def test_defragment():
    fs = SparseFS(list("0..111....22222"))
    fs.defragment()
    assert "".join(fs.data) == "022111222......"

    fs = SparseFS(list("00...111...2...333.44.5555.6666.777.888899"))
    fs.defragment()

    assert "".join(fs.data) == "0099811188827773336446555566.............."


def test_part1():
    assert part1() == 6461289671426


def test_defragmentwhole():
    fs = SparseFS(list("00...111...2...333.44.5555.6666.777.888899"))
    fs.defragment_whole()
    assert "".join(fs.data) == "00992111777.44.333....5555.6666.....8888.."


# Slow
# def test_part2():
#     assert part2() == 6488291456470
