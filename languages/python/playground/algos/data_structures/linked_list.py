class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next

    def __repr__(self) -> str:
        vals = self.values()
        return ",".join([str(i) for i in vals])

    def values(self) -> list[int]:
        if self.next is None:
            return [self.val]
        else:
            return [self.val] + self.next.values()

    @staticmethod
    def from_iter(i: list[int]) -> "ListNode | None":
        if not i:
            return None
        else:
            return ListNode(val=i[0], next=ListNode.from_iter(i[1:]))
