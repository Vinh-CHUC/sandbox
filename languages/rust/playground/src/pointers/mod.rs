// Recursive type this won't compile!!!
// enum List {
//     Const(i32, List),
//     Nil
// }
pub struct CustomSmartPointer {
    pub data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

#[cfg(test)]
mod tests {
    use crate::pointers::CustomSmartPointer;
    use std::ops::Deref;
    use std::rc::Rc;

    enum List {
        Cons(i32, Box<List>),
        Nil,
    }

    enum List2 {
        Cons(i32, Rc<List2>),
        Nil,
    }

    pub fn hello(name: &str) {
        print!("{}", name);
    }

    struct VinhsBox<T>(T);

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
        let a = List::Cons(5, Box::new(List::Cons(10, Box::new(List::Nil))));
        let b = List::Cons(3, Box::new(a));

        if let List::Cons(_e, _f) = b {}

        // Can't as things are moved in a box
        // let c = Cons(3, Box::new(a));

        let a = Rc::new(List2::Cons(
            5,
            Rc::new(List2::Cons(10, Rc::new(List2::Nil))),
        ));
        let _b = List2::Cons(3, Rc::clone(&a));
        let c = List2::Cons(3, Rc::clone(&a));

        if let List2::Cons(_e, _f) = c {}

        assert_eq!(Rc::strong_count(&a), 2);

        {
            let _d = Rc::clone(&a);
            assert_eq!(Rc::strong_count(&a), 3);
        }
        assert_eq!(Rc::strong_count(&a), 2);
    }

    #[test]
    fn ref_cells() {
        // The point is to allow to mutate the value held inside even if the RefCell itself is
        // immutable
        // e.g. "interior mutability" like mutable fields in C++
    }
}
