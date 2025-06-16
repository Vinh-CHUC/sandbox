from collections import deque
from copy import deepcopy
from dataclasses import dataclass
from itertools import chain
from typing import Deque

@dataclass
class TreeNode:
    val: int
    left: "TreeNode | None" = None
    right: "TreeNode | None" = None

    @staticmethod
    def from_breadthfirst(arr: list[int| None]) -> "TreeNode":
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

    def bf_traversal(self) -> list[int]:
        ret = []

        q: Deque["TreeNode| None"] = deque()
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
    def bf_traversal_rec(cls, level_nodes: list["TreeNode"]) -> list[int]:
        if not level_nodes:
            return []
        return [n.val for n in level_nodes] + cls.bf_traversal_rec(
            [
                i
                for i in chain(*[[t.left, t.right] for t in level_nodes])
                if i is not None
            ]
        )

    def preorder(self) -> list[int]:
        match self:
            case TreeNode(val=val, left=None, right=None):
                return [val]
            case TreeNode(val=val, left=None, right=TreeNode() as right):
                return [val] + right.preorder()
            case TreeNode(val=val, left=TreeNode() as left, right=None):
                return [val] + left.preorder()
            case TreeNode(val=val, left=TreeNode() as left, right=TreeNode() as right):
                return [val] + left.preorder() + right.preorder()
            case _:
                # Type checker is not good enough so I have to add this
                raise AssertionError

    def inorder(self) -> list[int]:
        match self:
            case TreeNode(val=val, left=None, right=None):
                return [val]
            case TreeNode(val=val, left=None, right=TreeNode() as right):
                return [val] + right.inorder()
            case TreeNode(val=val, left=TreeNode() as left, right=None):
                return left.inorder() + [val]
            case TreeNode(val=val, left=TreeNode() as left, right=TreeNode() as right):
                return left.inorder() + [val] + right.inorder()
            case _:
                # Type checker is not good enough so I have to add this
                raise AssertionError

    def postorder(self) -> list[int]:
        match self:
            case TreeNode(val=val, left=None, right=None):
                return [val]
            case TreeNode(val=val, left=None, right=TreeNode() as right):
                return right.postorder() + [val]
            case TreeNode(val=val, left=TreeNode() as left, right=None):
                return left.postorder() + [val]
            case TreeNode(val=val, left=TreeNode() as left, right=TreeNode() as right):
                return left.postorder() + right.postorder() + [val]
            case _:
                # Type checker is not good enough so I have to add this
                raise AssertionError

    def preorder_iter(self) -> list[int]:
        ret = []

        q: list[TreeNode] = []
        q.append(self)

        while q:
            node = q.pop()
            ret.append(node.val)
            if node.right:
                q.append(node.right)
            if node.left:
                q.append(node.left)

        return ret

    def inorder_iter(self) -> list[int]:
        ret = []

        q: list[TreeNode] = []
        node = self

        while q or node:
            while node is not None:
                q.append(node)
                node = node.left

            node = q.pop()
            ret.append(node.val)
            node = node.right

        return ret

    def inorder_iter_2(self) -> list[int]:
        ret = []

        q: list[TreeNode] = []
        node = self

        while q or node:
            if node is not None:
                q.append(node)
                node = node.left
            else:
                node = q.pop()
                ret.append(node.val)
                node = node.right

        return ret

    def postorder_iter(self) -> list[int]:
        ret = []

        q: list[TreeNode] = []
        node = self

        last_visited: TreeNode | None = None

        while q or node:
            if node is not None:
                q.append(node)
                node = node.left
            else:
                peek = q[-1]
                if peek.right and last_visited != peek.right:
                    node = peek.right
                else:
                    ret.append(peek.val)
                    last_visited = q.pop()

        return ret

    def postorder_iter2(self) -> list[int]:
        ret = []

        q: list[TreeNode] = []
        node = self

        last_visited: TreeNode | None = None

        while q or node:
            while node is not None:
                q.append(node)
                node = node.left

            peek = q[-1]

            if peek.right and last_visited != peek.right:
                node = peek.right
            else:
                ret.append(peek.val)
                last_visited = q.pop()

        return ret

    def __repr__(self) -> str:
        return ",".join([str(i) for i in self.bf_traversal()])

    def __str__(self) -> str:
        return ",".join([str(i) for i in self.bf_traversal()])
