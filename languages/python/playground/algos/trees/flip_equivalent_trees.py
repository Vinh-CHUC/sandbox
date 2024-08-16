from collections import deque
from copy import deepcopy
from dataclasses import dataclass
from itertools import chain
from typing import Deque, List, Optional, Tuple, Union


@dataclass
class TreeNode:
    val: int
    left: Union["TreeNode", None] = None
    right: Union["TreeNode", None] = None

    @staticmethod
    def from_breadthfirst(arr: List[Union[int, None]]) -> "TreeNode":
        if not arr:
            raise AssertionError

        elements = deque(deepcopy(arr))

        ###

        # Contains the nodes that need their left/right to be initialised
        nodes: Deque[TreeNode] = deque()

        val = elements.popleft()
        if val is None:
            raise AssertionError

        root = TreeNode(val)
        nodes.append(root)

        while elements:
            node = nodes.popleft()
            el = elements.popleft()
            if el is not None:
                node.left = TreeNode(el)
                nodes.append(node.left)

            if elements:
                el = elements.popleft()
                if el is not None:
                    node.right = TreeNode(el)
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
            case TreeNode(val=val, left=None, right=TreeNode() as right):
                return [val] + right.df_traversal()
            case TreeNode(val=val, left=TreeNode() as left, right=None):
                return [val] + left.df_traversal()
            case TreeNode(val=val, left=TreeNode() as left, right=TreeNode() as right):
                return [val] + left.df_traversal() + right.df_traversal()
            case _:
                # Type checker is not good enough so I have to add this
                raise AssertionError

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
    def flipEquiv(self, root1: Optional[TreeNode], root2: Optional[TreeNode]) -> bool:
        match (root1, root2):
            case None, None:
                return True
            case (TreeNode(), None) | (None, TreeNode()):
                return False
            case (
                TreeNode(val=val1),
                TreeNode(val=val2),
            ) if val1 != val2:
                return False
            case (
                TreeNode(val=val1, left=left_1, right=right_1),
                TreeNode(val=val2, left=left_2, right=right_2),
            ):
                return (
                    self.flipEquiv(left_1, left_2) and self.flipEquiv(right_1, right_2)
                ) or (
                    self.flipEquiv(left_1, right_2) and self.flipEquiv(right_1, left_2)
                )
            case _:
                raise AssertionError


assert Solution().flipEquiv(
    TreeNode.from_breadthfirst([1, 2, 3, 4, 5, 6, None, None, None, 7, 8]),
    TreeNode.from_breadthfirst([1, 3, 2, None, 6, 4, 5, None, None, None, None, 8, 7]),
)
assert Solution().flipEquiv(None, None)
assert not Solution().flipEquiv(
    None,
    TreeNode.from_breadthfirst([1]),
)
