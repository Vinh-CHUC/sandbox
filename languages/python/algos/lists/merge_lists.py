from typing import List, Union


class ListNode:
    def __init__(self, val: int = 0, next: Union["ListNode", None] = None):
        self.val = val
        self.next = next

    def __repr__(self) -> str:
        vals = self.values()
        return ",".join([str(i) for i in vals])

    def values(self) -> List[int]:
        if self.next is None:
            return [self.val]
        else:
            return [self.val] + self.next.values()

    @staticmethod
    def from_iter(i: List[int]) -> Union["ListNode", None]:
        if not i:
            return None
        else:
            return ListNode(val=i[0], next=ListNode.from_iter(i[1:]))


class SolutionRec:
    def mergeTwoLists(
        self, l1: Union[ListNode, None], l2: Union[ListNode, None]
    ) -> Union[ListNode, None]:
        match (l1, l2):
            case (ListNode(), ListNode()):
                if l1.val < l2.val:
                    return ListNode(l1.val, next=self.mergeTwoLists(l1.next, l2))
                else:
                    return ListNode(l2.val, next=self.mergeTwoLists(l1, l2.next))
            case l1, None:
                return l1
            case None, l2:
                return l2


Solution = SolutionRec


merged = Solution().mergeTwoLists(
    ListNode.from_iter([1, 2, 4]),
    ListNode.from_iter([1, 3, 4]),
)
assert merged is not None
assert merged.values() == [1, 1, 2, 3, 4, 4]

merged = Solution().mergeTwoLists(
    ListNode.from_iter([]),
    ListNode.from_iter([0]),
)
assert merged is not None
assert merged.values() == [0]


#############################

class SolutionIter:
    def mergeTwoLists(
        self, l1: Union[ListNode, None], l2: Union[ListNode, None]
    ) -> Union[ListNode, None]:
        if not (l1 or l2):
            return None

        ret = ListNode(-1)
        prev = ret


        def _consume(prev: ListNode, list_node: ListNode) -> Union[ListNode, None]:
            prev.next = list_node
            return list_node.next

        while l1 or l2:
            match (l1, l2):
                case (ListNode(), ListNode()):
                    if l1.val < l2.val:
                        l1 = _consume(prev, l1)
                    else:
                        l2 = _consume(prev, l2)
                case None, ListNode():
                    l2 = _consume(prev, l2)
                case ListNode(), None:
                    l1 = _consume(prev, l1)
            prev = prev.next

        return ret.next


Solution = SolutionIter


merged = Solution().mergeTwoLists(
    ListNode.from_iter([1, 2, 4]),
    ListNode.from_iter([1, 3, 4]),
)
assert merged is not None
assert merged.values() == [1, 1, 2, 3, 4, 4]

merged = Solution().mergeTwoLists(
    ListNode.from_iter([]),
    ListNode.from_iter([0]),
)
assert merged is not None
assert merged.values() == [0]
