#include "exercises/lru_cache/doubly_linked_list.h"

#include <ranges>
#include <vector>

#include <gtest/gtest.h>

TEST(DoublyLinkedList, Basics) {
  auto dll = DoublyLinkedList<int>(3);
  auto els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 1);
  ASSERT_EQ(els[0], 3);

  dll.append(4);
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 2);
  ASSERT_EQ(els[1], 4);

  dll.append(5);
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 3);
  ASSERT_EQ(els[2], 5);

  dll.prepend(10);
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 4);
  ASSERT_EQ(els[0], 10);

  dll.prepend(11);
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 5);
  auto eq = els == std::vector<int>{11, 10, 3, 4, 5};
  ASSERT_TRUE(eq);
}

TEST(DoublyLinkedList, Deletion) {
  auto dll = DoublyLinkedList<int>(3);
  dll.append(1);
  dll.append(2);
  dll.append(3);

  auto el = dll.head->next;
  auto ret = dll.remove(el);
  ASSERT_TRUE(ret.has_value());

  std::vector<int> els =
      dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 3);
  ASSERT_EQ(els, std::vector<int>({3, 2, 3}));
}

TEST(DoublyLinkedList, Deletion2) {
  auto dll = DoublyLinkedList<int>(3);
  dll.append(1);

  auto ret = dll.remove(dll.head);
  ASSERT_TRUE(ret.has_value());
  std::vector<int> els =
      dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 1);

  ret = dll.remove(dll.head);
  ASSERT_TRUE(ret.has_value());
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els.size(), 0);

  ret = dll.remove(dll.head);
  ASSERT_FALSE(ret.has_value());

  dll.append(1);
  dll.append(2);
  dll.append(3);
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els, std::vector<int>({1, 2, 3}));

  ret = dll.remove(dll.tail);
  ASSERT_TRUE(ret.has_value());
  els = dll.getGenerator() | std::ranges::to<std::vector<int>>();
  ASSERT_EQ(els, std::vector<int>({1, 2}));
}
