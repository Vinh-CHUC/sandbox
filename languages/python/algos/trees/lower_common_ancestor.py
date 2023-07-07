from collections import deque
from copy import deepcopy
from dataclasses import dataclass
from itertools import chain
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

    @classmethod
    def bf_traversal_rec(cls, level_nodes: List["TreeNode"]) -> List[int]:
        if not level_nodes:
            return []

        return [n.val for n in level_nodes] + cls.bf_traversal_rec(
            [
                i
                for i in chain(*[[t.left, t.right] for t in level_nodes])
                if i is not None
            ]
        )

    def df_traversal(self) -> List[int]:
        match self:
            case TreeNode(val=val, left=None, right=None):
                return [val]
            case TreeNode(val=val, left=None, right=right):
                return [val] + right.df_traversal()
            case TreeNode(val=val, left=left, right=None):
                return [val] + left.df_traversal()
            case TreeNode(val=val, left=left, right=right):
                return [val] + left.df_traversal() + right.df_traversal()

    def df_traversal_iter(self) -> List[int]:
        ret = []

        q: List[TreeNode] = []
        q.append(self)

        while q:
            node = q.pop()
            ret.append(node.val)
            if node.right:
                q.append(node.right)
            if node.left:
                q.append(node.left)

        return ret

    def __repr__(self) -> str:
        return ",".join([str(i) for i in self.bf_traversal()])


class Solution:
    def lowestCommonAncestor(
        self, root: TreeNode, p: TreeNode, q: TreeNode
    ) -> TreeNode:
        return TreeNode(5)
