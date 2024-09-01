use std::ops::Deref;
#[cfg(test)]
use std::rc::Rc;

// Recursive type this won't compile!!!
// enum List {
//     Const(i32, List),
//     Nil
// }
#[cfg(test)]
enum List {
    Cons(i32, Box<List>),
    Nil,
}

#[cfg(test)]
enum List2 {
    Cons(i32, Rc<List2>),
    Nil,
}

// A tuple struct
struct VinhsBox<T>(T);

#[cfg(test)]
impl<T> VinhsBox<T> {
    fn new(x: T) -> Self {
        Self(x)
    }
}

impl<T> Deref for VinhsBox<T> {
    type Target = T;

    // Important to return a reference other we'd move thigns out of self!
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
pub fn hello(name: &str) {
    print!("{}", name);
}

pub struct CustomSmartPointer {
    pub data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

mod LimitTracker {
    pub trait Messenger {
        fn send(&self, msg: &str);
    }

    pub struct LimitTracker<'a, T: Messenger> {
        messenger: &'a T,
        value: usize,
        max: usize,
    }

    impl<'a, T> LimitTracker<'a, T>
    where
        T: Messenger,
    {
        pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
            LimitTracker {
                messenger,
                value: 0,
                max,
            }
        }
        pub fn set_value(&mut self, value: usize) {
            self.value = value;

            let percentage_of_max = self.value as f64 / self.max as f64;

            if percentage_of_max >= 1.0 {
                self.messenger.send("Error: You are over your quota!");
            } else if percentage_of_max >= 0.9 {
                self.messenger
                    .send("Urgent warning: You've used up over 90% of your quota!");
            } else if percentage_of_max >= 0.75 {
                self.messenger
                    .send("Warning: You've used up over 75% of your quota!");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::pointers::hello;
    use crate::pointers::CustomSmartPointer;
    use crate::pointers::LimitTracker::{LimitTracker, Messenger};
    use crate::pointers::List::{Cons, Nil};
    use crate::pointers::List2;
    use crate::pointers::VinhsBox;
    use std::rc::Rc;

    #[test]
    fn basic_pointers() {
        let x = 5;
        let y = &x;

        assert_eq!(5, x);
        assert_eq!(5, *y);
    }

    #[test]
    fn dereferencing_boxes() {
        // The Deref trait could be called the ref trait really ....
        // It has to return a reference otherwise we'd move the value from outside of the box!!
        // As what is happening behind the scenes is actually something like *(x.deref())
        let x = 5;
        let y = Box::new(5);

        assert_eq!(5, x);
        assert_eq!(5, *y);

        let x = 5;
        let y = VinhsBox::new(5);

        assert_eq!(5, x);
        assert_eq!(5, *y);
    }

    #[test]
    fn deref_coercion_example() {
        let string_box = VinhsBox::new(String::from("hi"));

        // these work as T (VinhsBox here) is a Deref<Target=String>
        let _len = string_box.len();
        hello(&string_box);

        // otherwise we'd have to write something like &(*string_box)[..]
        // The more abstract rules are
        // &T to &U if T: Deref<Target=U>
        // &mut T to &mut U if T: DerefMut<Target=U>
        // &mut T to &U if T: DerefMut<Target=U>
    }

    #[test]
    fn drop_trait() {
        let _one = CustomSmartPointer {
            data: String::from("hi there"),
        };
        let _two = CustomSmartPointer {
            data: String::from("como estas"),
        };

        // Explicit destructor calls not allowed
        // one.drop();

        // But one can call the standard drop() function whenever
        let myvec = vec![1, 2, 3];
        drop(myvec); // Of course it has to move...
                     // println!("{:?}", myvec);
    }

    #[test]
    fn vec_factory() {
        print!("hi");
    }

    #[test]
    fn rc_pointers() {
        let a = Cons(5, Box::new(Cons(10, Box::new(Nil))));
        let _b = Cons(3, Box::new(a));
        // Can't as things are moved in a box
        // let c = Cons(3, Box::new(a));

        let a = Rc::new(List2::Cons(
            5,
            Rc::new(List2::Cons(10, Rc::new(List2::Nil))),
        ));
        let _b = List2::Cons(3, Rc::clone(&a));
        let _c = List2::Cons(3, Rc::clone(&a));

        assert_eq!(Rc::strong_count(&a), 3);

        {
            let _d = Rc::clone(&a);
            assert_eq!(Rc::strong_count(&a), 4);
        }
        assert_eq!(Rc::strong_count(&a), 3);
    }

    struct MockMessenger {
        sent_messages: Vec<String>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger {
                sent_messages: vec![],
            }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            // self.sent_messages.push(String::from(message));
        }
    }

    #[test]
    fn ref_cells() {
        // The point is to allow to mutate the value held inside even if the RefCell itself is
        // immutable
        // e.g. "interior mutability" like mutable fields in C++
    }
}
