use std::rc::{Rc, Weak};

pub struct DLLEl<T> {
    pub val: T,
    pub prev: Option<Rc<DLLEl<T>>>,
    pub next: Option<Rc<DLLEl<T>>>,
}

pub struct DoublyLinkedList<T> {
    pub head: Option<Rc<DLLEl<T>>>,
    pub tail: Option<Rc<DLLEl<T>>>,
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
            let el = Rc::new(DLLEl { val, prev: None, next: Some(head)});
            self.head = Some(el);
        } else {
            self.head = Some(Rc::new(DLLEl { val, prev: None, next: None}));
        }
    }
}

pub struct DoublyLinkedListIter<T> {
    pub current: Option<Rc<DLLEl<T>>>,
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
            self.current = node.next.clone();
            node.val.clone()
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
        assert_eq!(head.clone().unwrap().val, 3);
        assert!(head.unwrap().next.is_some());
    }
}
