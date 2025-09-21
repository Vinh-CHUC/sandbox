#include <functional>
#include <generator>
#include <memory>


template <typename T>
struct DLLEl {
  T val;
  std::weak_ptr<DLLEl<T>> prev;
  std::shared_ptr<DLLEl<T>> next;
};

template <typename T>
struct DoublyLinkedList {
  std::shared_ptr<DLLEl<T>> head;
  std::shared_ptr<DLLEl<T>> tail;

  DoublyLinkedList(T el){
    head = std::make_shared<DLLEl<T>>(el);
    tail = head;
  };

  std::generator<T>
  getGenerator() {
    // DLLEl<T>* ptr = &head;

    // while (ptr != &tail) {
    //   co_yield std::ref(ptr->val);

    //   ptr = ptr->next;
    // }
    co_yield head->val;
  }
};
