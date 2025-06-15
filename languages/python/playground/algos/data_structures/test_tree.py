import random

from algos.data_structures.tree import TreeNode


random.seed(42)

def test_preorder():
    for _ in range(50):
        t = TreeNode.from_breadthfirst(
            random.choices(
                list(range(1000)),
                k=random.choice(list(range(1, 250)))
            )
        )
        assert t.preorder() == t.preorder_iter()

def test_inorder():
    for _ in range(50):
        t = TreeNode.from_breadthfirst(
            random.choices(
                list(range(1000)),
                k=random.choice(list(range(1, 10)))
            )
        )
        assert t.inorder() == t.inorder_iter()
