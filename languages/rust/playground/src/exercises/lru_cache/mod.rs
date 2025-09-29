use std::cell::RefCell;
use std::rc::{Rc};

pub struct DLLEl<T> {
    pub val: T,
    pub prev: Option<Rc<RefCell<DLLEl<T>>>>,
    pub next: Option<Rc<RefCell<DLLEl<T>>>>,
}

pub struct DoublyLinkedList<T> {
    pub head: Option<Rc<RefCell<DLLEl<T>>>>,
    pub tail: Option<Rc<RefCell<DLLEl<T>>>>,
}

impl<T> DoublyLinkedList<T> {
    pub fn new() -> Self {
        DoublyLinkedList {
            head: None,
            tail: None,
        }
    }

    // Interestingly it'll be consumed step by step (next() by next())
    pub fn into_iter(self) -> DoublyLinkedListIter<T> {
        DoublyLinkedListIter { current: self.head }
    }

    pub fn prepend(&mut self, val: T) {
        if let Some(head) = self.head.take() {
            head.borrow_mut().prev = Some(
                Rc::new(RefCell::new(
                        DLLEl { val, prev: None, next: Some(head.clone())}
                ))
            );
            self.head = head.borrow().prev.clone();
        } else {
            self.head = Some(Rc::new(RefCell::new(DLLEl { val, prev: None, next: None})));
            self.tail = self.head.clone();
        }
    }

    pub fn append(&mut self, val: T) {
        if let Some(tail) = self.tail.take() {
            tail.borrow_mut().next = Some(
                Rc::new(RefCell::new(
                        DLLEl { val, prev: Some(tail.clone()), next: None}
                ))
            );
            self.tail = tail.borrow().next.clone();
        } else {
            self.tail = Some(Rc::new(RefCell::new(DLLEl { val, prev: None, next: None})));
            self.head = self.tail.clone();
        }
    }
}

pub struct DoublyLinkedListIter<T> {
    pub current: Option<Rc<RefCell<DLLEl<T>>>>,
}

impl<T: Clone> Iterator for DoublyLinkedListIter<T> {
    type Item = T;
    fn next(&mut self) -> Option<Self::Item> {
        // take() moves The Option<Rc> into this unnamed temporary
        // Then the Option map() moves the Rc into the lambda
        // It's dropped at the end of the lambda (just after having cloned its val)
        self.current.take().map(|node| {
            // Clone is the safer choice here (compared to RefCell?)
            // As there might be other holders of Rc's to the same node
            // Basically it's *forbiden* to move/modify what the RC holds
            self.current = node.borrow().next.clone();
            node.borrow().val.clone()
            // The Rc is dropped here (decrement ref count)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dll_basics() {
        let mut dll = DoublyLinkedList::new();
        dll.prepend(2);
        dll.prepend(3);

        let head = dll.head.clone();

        let values: Vec<_> = dll.into_iter().collect();

        // Below this point dll has been moved out and all **its** Rc have been dropped
        assert_eq!(values, vec![3, 2]);

        // But I still have another Rc to head :)
        // So the list is still here
        assert_eq!(head.clone().unwrap().borrow().val, 3);
        assert!(head.unwrap().borrow().next.is_some());
    }

    #[test]
    fn test_dll_basics_2() {
        let mut dll = DoublyLinkedList::new();
        dll.append(2);
        dll.append(3);
        dll.prepend(1);
        dll.prepend(0);

        let values: Vec<_> = dll.into_iter().collect();

        assert_eq!(values, vec![0, 1, 2, 3]);
    }
}
