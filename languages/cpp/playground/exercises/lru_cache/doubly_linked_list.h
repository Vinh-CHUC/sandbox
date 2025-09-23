#include <expected>
#include <generator>
#include <memory>

template <typename T> struct DLLEl {
  T val;
  std::weak_ptr<DLLEl<T>> prev;
  std::shared_ptr<DLLEl<T>> next;
};

// https://en.cppreference.com/w/cpp/language/template_specialization.html

template <typename T> struct DoublyLinkedList {
  std::shared_ptr<DLLEl<T>> head;
  std::shared_ptr<DLLEl<T>> tail;

  DoublyLinkedList(T val): head(std::make_shared<DLLEl<T>>(val)), tail(head) {
    // Why not have them point to each other?
    // An invariant that we want is that we never want prev/next to point to
    // oneself Or more generally we never want following prev/next to lead to
    // any cycles
    //
    // An alternative would to only initialise one of head or tail at this
    // point?
  }

  void prepend(T val);

  void append(T val);

  std::expected<void, const char *> remove(std::shared_ptr<DLLEl<T>> el);

  std::generator<T> getGenerator();
};

template<typename T> void DoublyLinkedList<T>::prepend(T val){
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

template<typename T> void DoublyLinkedList<T>::append(T val) {
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

template<typename T>  std::expected<void, const char *> DoublyLinkedList<T>::remove(std::shared_ptr<DLLEl<T>> el) {
  if (el == nullptr){
    return std::unexpected("Trying to remove nullptr");
  }

  auto try_prev = el->prev.lock();

  if (el == head){
    // Only one element
    if (head == tail){
      head = nullptr;
      tail = nullptr;
    } else {
      head = head->next;
    }
  } else if(try_prev){
    try_prev->next = el->next;
    if (el->next){
      el->next->prev = try_prev;
    }
  } else {
    return std::unexpected("Unexpected error");
  }
  return {};
}

template<typename T> std::generator<T> DoublyLinkedList<T>::getGenerator() {
  std::shared_ptr<DLLEl<T>> ptr = head;
  while (ptr != nullptr) {
    co_yield ptr->val;
    ptr = ptr->next;
  }
}
