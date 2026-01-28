import numpy as np

STRUCT_ALIGNED_DTYPE = np.dtype([
    ("header", [
        ("id", "u4"),
        ("type", "S1"),
    ]),
    ("payload", [
        ("data", "f8", (3,)),
        ("meta", [
            ("timestamp", "f8"),
            ("flags", "u1"),
        ]),
    ]),
    ("footer", "u4"),
], align=True)

PACKED_STRUCTURED_DTYPE = np.dtype([
    ("header", [
        ("id", "u4"),
        ("type", "S1"),
    ]),
    ("payload", [
        ("data", "f8", (3,)),
        ("meta", [
            ("timestamp", "f8"),
            ("flags", "u1"),
        ]),
    ]),
    ("footer", "u4"),
], align=False)


def test_isaligned_struct():
    """
    Whether the layout is compatible with C struct alignment is a property of the dtype
    While alignment is a property of the array itself (see other tests)
    """
    assert STRUCT_ALIGNED_DTYPE.isalignedstruct

    assert not PACKED_STRUCTURED_DTYPE.isalignedstruct
    assert PACKED_STRUCTURED_DTYPE.alignment == 1

class TestAlignment():
    def test_alignment_basic(self):
        a = np.zeros(5, dtype=STRUCT_ALIGNED_DTYPE)
        # This would qualify for C struct reinterpretation:
        # alignment + alignedstruct
        # There is also ISBEHAVED in C api
        assert a.flags.aligned

        """
        The alignment of the array itself has nothing to do with the aligned_struct property
        Roughly it's about whether
        - all the strides are dividable by the alignment
        - the base pointer address is itself dividable by the alignment
        """
        b = np.zeros(5, dtype=PACKED_STRUCTURED_DTYPE)
        assert b.flags.aligned

        assert a.strides[0] > b.strides[0]

        # Not true in the general case, ie slice views
        assert a.strides[0] == a.dtype.itemsize
        assert b.strides[0] == b.dtype.itemsize

    def test_misaligned(self):
        arr = np.zeros(40, dtype=np.uint8)
        assert arr.flags.aligned

        # BTW 32 | (40 * 8), otherwise wouldn't work
        int_view = arr.view(np.int32)
        assert int_view.flags.aligned


        ## Part 2
        arr = np.zeros(41, dtype=np.uint8)
        assert arr.flags.aligned

        ## BOOM the pointer to beginning of the array is not dividable by 32
        int_view = arr[1:].view(np.int32)
        assert not int_view.flags.aligned
        # The reason
        assert int_view.dtype.alignment > 1

    def test_contiguous(self):
        """
        For 1D array C vs F contiguous is not really meaningful
        """
        arr = np.zeros(40, dtype=np.uint8)
        assert arr.flags.c_contiguous
        assert arr.flags.f_contiguous
