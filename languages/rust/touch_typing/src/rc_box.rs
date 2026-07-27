//! Smart pointers: `Box`, `Rc`/`Weak`, `RefCell`, `Arc`, `Arc<Mutex<_>>`.

// @snippet Box: heap-allocate a single owner
fn box_new() {
    let b = Box::new(5);
    let derefed = *b;
}

// @snippet Rc: single-threaded shared ownership with refcount
fn rc_clone() {
    use std::rc::Rc;
    let rc = Rc::new(10);
    let rc2 = Rc::clone(&rc);
    let count = Rc::strong_count(&rc);
}

// @snippet downgrade / upgrade: Weak references break cycles
fn rc_weak() {
    use std::rc::Rc;
    let rc = Rc::new(7);
    let weak = Rc::downgrade(&rc);
    let strong_again = weak.upgrade();
}

// @snippet RefCell: interior mutability, single-threaded, runtime-checked
fn refcell_borrow_mut() {
    use std::cell::RefCell;
    use std::rc::Rc;
    let cell = Rc::new(RefCell::new(0));
    {
        let mut b = cell.borrow_mut();
        *b += 1;
    }
}

// @snippet Arc: thread-safe Rc
fn arc_clone() {
    use std::sync::Arc;
    let arc = Arc::new(12);
    let arc2 = Arc::clone(&arc);
    let count = Arc::strong_count(&arc);
}

// @snippet Mutex: interior mutability across threads
fn arc_mutex() {
    use std::sync::{Arc, Mutex};
    let pair = Arc::new(Mutex::new(0));
    let guard = pair.lock().unwrap();
    let inner = *guard;
}
