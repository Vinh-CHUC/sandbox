from collections import deque
from copy import deepcopy
from dataclasses import dataclass
from typing import Deque, List, Union


@dataclass
class TreeNode:
    val: int
    left: Union["TreeNode", None] = None
    right: Union["TreeNode", None] = None

    @staticmethod
    def from_breadthfirst(arr: List[int]) -> Union["TreeNode", None]:
        if not arr:
            return None

        elements = deque(deepcopy(arr))

        ###

        # Contains the nodes that need their left/right to be initialised
        nodes: Deque[TreeNode] = deque()
        root = TreeNode(elements.popleft())
        nodes.append(root)

        while elements:
            node = nodes.popleft()
            node.left = TreeNode(elements.popleft())
            nodes.append(node.left)
            if elements:
                node.right = TreeNode(elements.popleft())
                nodes.append(node.right)

        return root

    def bf_traversal(self) -> List[int]:
        ret = []

        q: Deque[Union[TreeNode, None]] = deque()
        q.append(self)

        while len(q):
            node = q.popleft()
            match node:
                case None:
                    pass
                case TreeNode(val, left, right):
                    ret.append(val)
                    q.append(left)
                    q.append(right)

        return ret

    def __repr__(self) -> str:
        return ",".join([str(i) for i in self.bf_traversal()])


class Solution:
    def lowestCommonAncestor(
        self, root: TreeNode, p: TreeNode, q: TreeNode
    ) -> TreeNode:
        return TreeNode(5)
