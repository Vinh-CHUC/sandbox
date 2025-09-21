#include <generator>
#include <memory>

template <typename T> struct DLLEl {
  T val;
  std::weak_ptr<DLLEl<T>> prev;
  std::shared_ptr<DLLEl<T>> next;
};

template <typename T> struct DoublyLinkedList {
  std::shared_ptr<DLLEl<T>> head;
  std::shared_ptr<DLLEl<T>> tail;

  DoublyLinkedList(T val) {
    // Why not have them point to each other?
    // An invariant that we want is that we never want prev/next to point to
    // oneself Or more generally we never want following prev/next to lead to
    // any cycles
    //
    // An alternative would to only initialise one of head or tail at this
    // point?
    head = std::make_shared<DLLEl<T>>(val);
    tail = head;
  }

  void prepend(T val) {
    auto el = std::make_shared<DLLEl<T>>(val);
    if (tail == nullptr && head == nullptr) {
      head = el;
      tail = el;
    } else {
      auto tmp = head;
      head = el;
      head->next = tmp;
      tmp->prev = head;
    }
  }

  void append(T val) {
    auto el = std::make_shared<DLLEl<T>>(val);
    if (tail == nullptr && head == nullptr) {
      head = el;
      tail = el;
    } else {
      auto tmp = tail;
      tail = el;
      tail->prev = tmp;
      tmp->next = tail;
    }
  }

  std::generator<T> getGenerator() {
    std::shared_ptr<DLLEl<T>> ptr = head;
    while (ptr != nullptr) {
      co_yield ptr->val;
      ptr = ptr->next;
    }
  }
};
