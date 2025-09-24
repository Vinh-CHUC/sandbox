#pragma once

#include <iostream>
#include <list>
#include <memory>
#include <ostream>
#include <vector>

template <typename T> struct ListNode {
  T val{};
  std::unique_ptr<ListNode<T>> next{nullptr};

  std::list<T> values() const {
    if (next == nullptr) {
      return std::list<T>{val};
    } else {
      auto v = std::list<T>{val};
      auto remaining = next->values();
      v.splice(v.end(), remaining);
      return v;
    }
  };

  static std::unique_ptr<ListNode<T>> from_it(std::vector<T>::iterator begin,
                                              std::vector<T>::iterator end) {
    if (begin == end) {
      return nullptr;
    } else {
      return std::make_unique<ListNode<T>>(*begin, from_it(begin + 1, end));
    }
  }
};

template <typename T> using List = std::unique_ptr<ListNode<T>>;
template <typename T> using SList = std::shared_ptr<ListNode<T>>;

template <typename T>
std::ostream &operator<<(std::ostream &os, const ListNode<T> &list_node) {
  auto values = list_node.values();
  os << "[";
  for (auto v : values) {
    os << std::to_string(v) << ",";
  }
  os << "]";
}

template <typename T> List<T> reverse(List<T> list_node) {
  if (list_node == nullptr) {
    return nullptr;
  }

  List<T> prev = nullptr;
  List<T> curr = std::move(list_node);

  while (curr != nullptr) {
    auto bkp = std::move(curr->next);
    curr->next = std::move(prev);

    prev = std::move(curr);
    curr = std::move(bkp);
  }

  return prev;
}

// Not really possible with unique_ptr?
/* template<typename T> List<T> do_reverse_rec(List<T> list_node){ */
/*   if(list_node->next == nullptr){ */
/*     return list_node; */
/*   } */

/*   auto first = do_reverse_rec(std::move(list_node->next)); */

/*   std::cout << "Node: " << list_node->val << std::endl; */

/*   std::cout << "A" << std::endl; */
/*   List<T> next = std::move(list_node->next); */
/*   std::cout << "B" << std::endl; */
/*   list_node->next = nullptr; */
/*   std::cout << "C" << std::endl; */

/*   if(next == nullptr){std::cout << "SHIT" << std::endl;} */

/*   next->next = std::move(list_node); */
/*   std::cout << "D" << std::endl; */

/*   return first; */
/* } */

/* template<typename T> List<T> reverse_rec(List<T> list_node){ */
/*   if(list_node == nullptr){return nullptr;} */
/*   return do_reverse_rec(std::move(list_node)); */
/* } */
