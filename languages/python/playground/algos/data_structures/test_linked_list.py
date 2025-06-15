import numpy as np

from algos.data_structures.linked_list import ListNode

DATA = list(np.random.randint(0, high=100, size=100))


def test_list_node():
    llist = ListNode.from_iter(DATA)
    assert llist is not None
    assert llist.values() == DATA
