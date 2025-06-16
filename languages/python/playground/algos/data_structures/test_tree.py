import random

from algos.data_structures.tree import TreeNode


random.seed(42)

def sample() -> list[int]:
    return list(set(random.choices(
        list(range(1000)),
        k=random.choice(list(range(1, 250)))
    )))

def test_preorder():
    for _ in range(50):
        t = TreeNode.from_breadthfirst(sample())
        assert t.preorder() == t.preorder_iter()

def test_inorder():
    for _ in range(50):
        t = TreeNode.from_breadthfirst(sample())
        assert t.inorder() == t.inorder_iter()
        assert t.inorder() == t.inorder_iter_2()

def test_postorder():
    for _ in range(50):
        t = TreeNode.from_breadthfirst(sample())
        assert t.postorder() == t.postorder_iter()
        assert t.postorder() == t.postorder_iter2()
