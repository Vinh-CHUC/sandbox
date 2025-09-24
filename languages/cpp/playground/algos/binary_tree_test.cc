#include <gtest/gtest.h>

#include "algos/binary_tree.h"

TEST(BinaryTree, Basic) {
  auto t = TreeNode<int>::from_breadthfirst({1, 2, 3, 4, 5, 6, 7});

  auto expected = std::list<int>{1, 2, 3, 4, 5, 6, 7};
  ASSERT_EQ(t->breadthfirst(), expected);
}

TEST(BinaryTree, LowestCommonAncestor) {
  auto t = TreeNode<int>::from_breadthfirst(
      {3, 5, 1, 6, 2, 0, 8, std::nullopt, std::nullopt, 7, 4});

  auto lca = lowestCommonAncestor(t, 5, 1);
  ASSERT_TRUE(lca.has_value());
  ASSERT_TRUE(lca.value() != nullptr);
  ASSERT_EQ(lca.value()->val, 3);
}
