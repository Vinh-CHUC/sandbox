#include <gtest/gtest.h>

#include "algos/linked_list.h"

TEST(LinkedList, Basics){
  auto v = std::vector<int>{1, 2, 3, 4, 5};

  std::unique_ptr<ListNode<int>> l = ListNode<int>::from_it(v.begin(), v.end());

  auto values = l->values();

  auto expected = std::list<int>{1, 2, 3, 4, 5};
  ASSERT_EQ(values, expected);
}

TEST(LinkedList, Reverse){
  auto v = std::vector<int>{1, 2, 3, 4, 5};

  std::unique_ptr<ListNode<int>> l = ListNode<int>::from_it(v.begin(), v.end());

  auto reversed_values = reverse(std::move(l))->values();

  auto expected = std::list<int>{5, 4, 3, 2, 1};
  ASSERT_EQ(reversed_values, expected);
}
