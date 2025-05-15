#include <gtest/gtest.h>

#include "algos/binary_tree.h"

TEST(BinaryTree, Basic){
  auto t = TreeNode<int>::from_breadthfirst(
    {1, 2, 3, 4, 5, 6, 7}
  );

  auto expected = std::list<int>{1, 2, 3, 4, 5, 6, 7};
  ASSERT_EQ(
    t->breadthfirst(),
    expected
  );
}
