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


class SolutionConvoluted:
    def LongestFromRoot(self, root: Optional[TreeNode]) -> int:
        match root:
            case TreeNode(left=None, right=None):
                return 0
            case TreeNode(left=left, right=None):
                return 1 + self.LongestFromRoot(left)
            case TreeNode(left=None, right=right):
                return 1 + self.LongestFromRoot(right)
            case TreeNode(left=left, right=right):
                return 1 + max(self.LongestFromRoot(left), self.LongestFromRoot(right))
            case _:
                raise AssertionError

    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        match root:
            case TreeNode(left=None, right=None):
                return 0
            case TreeNode(left=left, right=None):
                return max(
                    1 + self.LongestFromRoot(left), self.diameterOfBinaryTree(left)
                )
            case TreeNode(left=None, right=right):
                return max(
                    1 + self.LongestFromRoot(right), self.diameterOfBinaryTree(right)
                )
            case TreeNode(left=left, right=right):
                return max(
                    2 + self.LongestFromRoot(left) + self.LongestFromRoot(right),
                    self.diameterOfBinaryTree(left),
                    self.diameterOfBinaryTree(right),
                )
            case _:
                raise AssertionError


Solution = SolutionConvoluted

assert (
    Solution().diameterOfBinaryTree(TreeNode.from_breadthfirst(list(range(1, 6)))) == 3
)

assert Solution().diameterOfBinaryTree(TreeNode.from_breadthfirst([1, 2])) == 1

assert (
    Solution().diameterOfBinaryTree(
        TreeNode.from_breadthfirst(
            [
                4,
                -7,
                -3,
                None,
                None,
                -9,
                -3,
                9,
                -7,
                -4,
                None,
                6,
                None,
                -6,
                -6,
                None,
                None,
                0,
                6,
                5,
                None,
                9,
                None,
                None,
                -1,
                -4,
                None,
                None,
                None,
                -2,
            ]
        )
    )
    == 8
)


"""
The diameter is the length of the path that goes through a node with longest "(left + right)"
"""


# For a given node maximum paths that arrive to it on the left/right
@dataclass
class LeftRightLs:
    left: int
    right: int


class SolutionSimpler:
    def maxLeftPlusRight(self, root: Optional[TreeNode]) -> Tuple[LeftRightLs, int]:
        match root:
            case None | TreeNode(left=None, right=None):
                return (LeftRightLs(0, 0), 0)
            case TreeNode(left=left, right=right):
                left_lr, max_left = self.maxLeftPlusRight(left)
                right_lr, max_right = self.maxLeftPlusRight(right)
                current_left_right = LeftRightLs(
                    1 + max(left_lr.left, left_lr.right) if left is not None else 0,
                    1 + max(right_lr.left, right_lr.right) if right is not None else 0,
                )
                return (
                    current_left_right,
                    max(
                        max_left,
                        max_right,
                        current_left_right.left + current_left_right.right,
                    ),
                )

    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        return self.maxLeftPlusRight(root)[1]


Solution = SolutionSimpler


assert (
    Solution().diameterOfBinaryTree(TreeNode.from_breadthfirst(list(range(1, 6)))) == 3
)

assert Solution().diameterOfBinaryTree(TreeNode.from_breadthfirst([1, 2])) == 1

assert (
    Solution().diameterOfBinaryTree(
        TreeNode.from_breadthfirst(
            [
                4,
                -7,
                -3,
                None,
                None,
                -9,
                -3,
                9,
                -7,
                -4,
                None,
                6,
                None,
                -6,
                -6,
                None,
                None,
                0,
                6,
                5,
                None,
                9,
                None,
                None,
                -1,
                -4,
                None,
                None,
                None,
                -2,
            ]
        )
    )
    == 8
)
