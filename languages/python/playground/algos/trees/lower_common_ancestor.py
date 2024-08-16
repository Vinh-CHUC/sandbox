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


@dataclass
class Found:
    lca: Union[int, None] = None
    contains_p: bool = False
    contains_q: bool = False


class SolutionPure:
    @classmethod
    def do_lca(cls, node: Union[TreeNode, None], p: TreeNode, q: TreeNode) -> Found:
        match node:
            case None:
                return Found()
            case TreeNode(val, left, right):
                found_left = cls.do_lca(left, p, q)
                found_right = cls.do_lca(right, p, q)
                if found_left.lca is not None:
                    return found_left
                elif found_right.lca is not None:
                    return found_right
                else:
                    contains_p = (
                        found_right.contains_p or found_left.contains_p or val == p.val
                    )
                    contains_q = (
                        found_right.contains_q or found_left.contains_q or val == q.val
                    )
                    lca = val if contains_p and contains_q else None
                    return Found(lca, contains_p, contains_q)

    def lowestCommonAncestor(
        self, root: TreeNode, p: TreeNode, q: TreeNode
    ) -> TreeNode:
        found = self.do_lca(root, p, q)
        if found.lca is not None:
            return TreeNode(val=found.lca)
        else:
            raise RuntimeError("Not found")


Solution = SolutionPure

assert (
    Solution()
    .lowestCommonAncestor(
        TreeNode.from_breadthfirst([3, 5, 1, 6, 2, 0, 8, None, None, 7, 4]),
        TreeNode(5),
        TreeNode(1),
    )
    .val
    == 3
)
assert (
    Solution()
    .lowestCommonAncestor(
        TreeNode.from_breadthfirst([3, 5, 1, 6, 2, 0, 8, None, None, 7, 4]),
        TreeNode(5),
        TreeNode(4),
    )
    .val
    == 5
)
assert (
    Solution()
    .lowestCommonAncestor(TreeNode.from_breadthfirst([1, 2]), TreeNode(1), TreeNode(2))
    .val
    == 1
)
