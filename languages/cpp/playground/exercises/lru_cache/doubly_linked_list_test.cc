#include "exercises/lru_cache/doubly_linked_list.h"

#include <ranges>
#include <vector>

#include <gtest/gtest.h>

TEST(DoublyLinkedList, Basics) {
  auto dll = DoublyLinkedList<int>(3);

  auto els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 1);
}
