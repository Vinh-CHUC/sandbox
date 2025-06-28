//! mut_and_immut
//! ```compile_fail
//! let mut a = 5;
//! let b = &a;
//! a += 1;  // A mutation that cuts through the lifetime of b
//! println!("{:?}", b);
//! ```
//!
//!
//! mut_and_mut
//! ```compile_fail
//! let mut a = 5;
//! let b = &mut a;
//! a += 1;  // Can't have modification throught the original owner
//! // One way to think about his is that the += fn has to borrow (mutably in this instance)
//! *b += 1;
//! // In other words while b is "active" (NLL), a is shadowed
//! ```
//!
//!
//! mut_and_mut
//! ```compile_fail
//! let mut a = 5;
//! let b = &mut a;
//! println!("{:?}", a);  // Nor an immutable borrow
//! *b += 1;
//! ```
//!
//!
//! mut_and_two_muts
//! ```compile_fail
//! let mut a = 5;
//! // While a is immutably borrowed (as b):
//! // - a itself can't be used
//! // - no other borrows can happen (immutable or not)
//! let b = &mut a;
//! let c = &mut a;
//! *c += 1;
//! println!("{:?}", c);
//! *b += 1;
//! println!("{:?}", b);
//! println!("{:?}", a);
//! ```
//!
//! Misuse of borrow for RefCell
//! ```should_panic
//! use std::cell::RefCell;
//! let a = RefCell::new(42);
//! let mut mut_ref = a.borrow_mut();
//! let ref2 = a.borrow();
//! println!("{:?}", mut_ref);
//! ```
//!
//!
//! Cannot fool the RefCell by having more than one mutable borrows
//! from a given borrow_mut();
//! ```compile_fail
//! use std::cell::RefCell;
//! let a = RefCell::new(42);
//! let mut mut_ref = a.borrow_mut();
//! let mut b =  &mut *mut_ref;
//! let mut c =  &mut *mut_ref;
//! println!("{:?}", b);
//! ```

#[cfg(test)]
mod tests {
    #[test]
    fn mut_and_immut() {
        // OK immutable borrow that is within a mutable lifetime
        let mut a = 5;

        // The immutable borrow isn't intersecting in any way with mutable operations
        let b = &a;
        println!("{:?}", a); // Immutable that cuts through: ok
        println!("{:?}", b);

        // This is allowed while b is still in scope: Non-lexical lifetime!!
        a += 1;
        println!("{:?}", a);
    }

    #[test]
    fn mut_and_mut() {
        let mut a = 5;
        // While a is immutably borrowed (as b):
        // - a itself can't be used
        // - no other borrows can happen (immutable or not)
        let b = &mut a;
        *b += 1;
        println!("{:?}", b);
        let c = &mut a;
        *c += 1;
        println!("{:?}", c);
        println!("{:?}", a);
    }
}
