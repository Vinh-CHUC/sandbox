from collections import deque
from copy import deepcopy
from dataclasses import dataclass
from itertools import chain
from functools import lru_cache
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

    def __hash__(self):
        return id(self)

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


"""
Too slow to pass on leetcode (as I can't implement __hash__ for TreeNode)
"""


class Solution:
    @lru_cache(maxsize=None)
    def maxPathFromRoot(self, root: Optional[TreeNode]) -> int:
        match root:
            case TreeNode(val=val, left=None, right=None):
                return val
            case TreeNode(val=val, left=None, right=right):
                return max(
                    val + self.maxPathFromRoot(right),
                    val
                )
            case TreeNode(val=val, left=left, right=None):
                return max(
                    val + self.maxPathFromRoot(left),
                    val
                )
            case TreeNode(val=val, left=left, right=right):
                return max(
                    val + max(
                        self.maxPathFromRoot(left),
                        self.maxPathFromRoot(right)
                    ),
                    val
                )

    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        match root:
            case TreeNode(val=val, left=None, right=None):
                return val
            case TreeNode(val=val, left=None, right=right):
                return max(
                    val + self.maxPathFromRoot(right),
                    self.maxPathSum(right),
                    val
                )
            case TreeNode(val=val, left=left, right=None):
                return max(
                    val + self.maxPathFromRoot(left),
                    self.maxPathSum(left),
                    val
                )
            case TreeNode(val=val, left=left, right=right):
                max_from_left = self.maxPathFromRoot(left)
                max_from_right = self.maxPathFromRoot(right)
                return max(
                    val + max_from_left + max_from_right,
                    val + max_from_left,
                    val + max_from_right,
                    self.maxPathSum(left),
                    self.maxPathSum(right),
                    val
                )


assert Solution().maxPathSum(TreeNode.from_breadthfirst([1, 2, 3])) == 6
assert (
    Solution().maxPathSum(TreeNode.from_breadthfirst([-10, 9, 20, None, None, 15, 7]))
    == 42
)
assert Solution().maxPathSum(TreeNode.from_breadthfirst([-3])) == -3
assert Solution().maxPathSum(TreeNode.from_breadthfirst([2, -1])) == 2
assert Solution().maxPathSum(TreeNode.from_breadthfirst([-2, -1])) == -1
assert Solution().maxPathSum(TreeNode.from_breadthfirst([1, -2, 3])) == 4
