from typing import List, Union, Tuple
import numpy as np

DATA = list(np.random.randint(0, high=100, size=100))


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


class SolutionIter:
    def reverseList(self, l1: Union[ListNode, None]) -> Union[ListNode, None]:
        """
        *   *
            a->b->c->d->e

          * *
        <-a b->c->d->e

             * *
        <-a<-b c->d->e

                      * *
        <-a<-b<-c<-d-<e
        """

        def loop_iter(
            prev: Union[ListNode, None], curr: Union[ListNode, None]
        ) -> Union[ListNode, None]:
            match (prev, curr):
                case (_, None):
                    return prev
                case (None, ListNode(val=val, next=next)):
                    return loop_iter(ListNode(val), next)
                case (ListNode(), ListNode(val=val, next=next)):
                    return loop_iter(ListNode(val, next=prev), next)

        return loop_iter(None, l1)


Solution = SolutionIter

reversed = Solution().reverseList(ListNode.from_iter(DATA))
assert reversed is not None and reversed.values() == DATA[::-1]
assert Solution().reverseList(None) is None


#################


class SolutionIter2:
    def reverseList(self, l1: Union[ListNode, None]) -> Union[ListNode, None]:
        """
        *   *
            a->b->c->d->e

          * *
        <-a b->c->d->e

             * *
        <-a<-b c->d->e

                      * *
        <-a<-b<-c<-d-<e
        """
        prev = None
        curr = l1

        while curr is not None:
            prev = ListNode(curr.val, next=prev)
            curr = curr.next

        return prev


Solution = SolutionIter2

reversed = Solution().reverseList(ListNode.from_iter(DATA))
assert reversed is not None and reversed.values() == DATA[::-1]
assert Solution().reverseList(None) is None

#################


class SolutionRec:
    def do_reverseList(self, l1: ListNode) -> Tuple[ListNode, ListNode]:
        match l1:
            case ListNode(val=_, next=None):
                return (l1, l1)
            case ListNode(val=_, next=next):
                first, last = self.do_reverseList(next)
                last.next = l1
                last.next.next = None
                return first, l1

    def reverseList(self, l1: Union[ListNode, None]) -> Union[ListNode, None]:
        if l1 is None:
            return None

        first, _ = self.do_reverseList(l1)
        return first


Solution = SolutionRec

reversed = Solution().reverseList(ListNode.from_iter(DATA))
assert reversed is not None and reversed.values() == DATA[::-1]
assert Solution().reverseList(None) is None
