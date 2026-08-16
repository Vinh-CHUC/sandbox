//! ```compile_fail
//! // A single mutable reference can be sent to a scoped thread (a `&mut T` is
//! // `Send` when `T: Sync`), but mixing an exclusive borrow of `value` (thread 1)
//! // with a shared borrow of `value` (thread 2) in the same scope is rejected:
//! // the two borrows overlap.
//! use std::thread;
//!
//! let mut value = 5_i32;
//! let mut_ref = &mut value;
//! thread::scope(|scope| {
//!     scope.spawn(|| {
//!         *mut_ref += 1;
//!         println!("exclusive in thread: {}", *mut_ref);
//!     });
//!     scope.spawn(|| {
//!         println!("{:?}", &value);
//!     });
//! });
//! ```

#[cfg(test)]
mod tests {
    use std::cell::{Cell, RefCell};
    use std::rc::Rc;
    use std::sync::mpsc;
    use std::sync::{Arc, Mutex};
    use std::thread;
    use std::time::Duration;

    #[test]
    fn thread_basics() {
        let thread_one = thread::spawn(|| {
            for i in 1..10 {
                println!("Thread 1, step {}", i);
                thread::sleep(Duration::from_millis(1));
            }
        });

        let thread_two = thread::spawn(|| {
            for i in 1..20 {
                println!("Thread 2, step {}", i);
                thread::sleep(Duration::from_millis(1));
            }
        });

        thread_one.join().expect("thread one panicked");
        thread_two.join().expect("thread one panicked");
    }

    #[test]
    fn these_data_structures_are_send() {
        #[derive(Debug)]
        struct Pair {
            name: String,
            value: i32,
        }

        let _primitive = 10_i32;
        let _pair = Pair {
            name: String::from("x"),
            value: 42,
        };

        // These are heap allocated but they uniquely own their resources
        // ~ unique pointers
        let _string = String::from("hello");
        let _vec = vec![1, 2, 3];
        let _vec_of_pairs = vec![_pair];
        let _boxed = Box::new(1_u8);
        let _ref_cell = RefCell::new(3.14_f64);

        // Send~:
        // - fully owns itself, no concept of shared pointer

        let thread_one = thread::spawn(move || {
            println!(
                "{:?} {:?} {:?} {:?} {:?} {:?}",
                _primitive, _string, _vec, _vec_of_pairs, _boxed, _ref_cell
            );
        });

        thread_one.join().expect("thread one panicked");
    }

    #[test]
    fn these_data_structures_are_sync() {
        let _primitive = 10_i32;
        let _string = String::from("hello");
        let _vec = vec![1, 2, 3];

        let _boxed = Box::new(1_u8);
        // This is a read-only so safe to shared across threads
        let _arc = Arc::new(3.14_f64);
        let _mutex = Mutex::new(42_u8);

        thread::scope(|scope| {
            let _t1 = scope.spawn(|| {
                println!(
                    "{:?} {:?} {:?}",
                    _primitive, _string, _vec
                );
            });
            let _t2 = scope.spawn(|| {
                println!(
                    "{:?} {:?} {:?}",
                    _primitive, _string, _vec
                );
            });
            let _t3 = scope.spawn(|| {
                println!("{:?} {:?} {:?}", _boxed, _arc, *_mutex.lock().unwrap());
            });
        });
    }

}
