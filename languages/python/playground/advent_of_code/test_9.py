from advent_of_code._9_disk_fragmenter import DenseFS, SparseFS

def test_densefs():
    assert DenseFS([int(s) for s in "12345"]).toSparse().data == (
        "0..111....22222"
    )

    assert DenseFS([int(s) for s in "2333133121414131402"]).toSparse().data == (
        "00...111...2...333.44.5555.6666.777.888899"
    )

def test_sparsefs():
    assert SparseFS("0..111....22222").toDense().data == [int(s) for s in "12345"]
    assert SparseFS(
        "00...111...2...333.44.5555.6666.777.888899"
    ).toDense().data == [int(s) for s in "2333133121414131402"]
