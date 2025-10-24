//! ```compile_fail
//! use playground::rust_features::lifetimes::*;
//! let s = String::from("foo");
//! let u: &str;
//! {
//!     let t = String::from("bar");
//!     u = tied_lifetimes(true, &s, &t);
//! }
//! println!("{:?}", u);
//! // Even though we're returning a ref to s here, the lifetime annotation
//! // is tied to both x and y. So u's lifetime cannot exceed any of x or y
//! ```
//!
//! ```compile_fail
//! use playground::rust_features::lifetimes::*;
//! let s = String::from("foo");
//! let u: &str;
//! {
//!     let t = String::from("bar");
//!     let mystruct = TiedStruct { x: &s, y: &t };
//!     u = mystruct.x;
//! }
//! // The fact that u's lifetime is actually s's is lost here
//! println!("{:?}", u);
//! ```
//!
//! ```compile_fail
//! use playground::rust_features::lifetimes::*;
//! let whoo: IndependentStruct;
//! let s = String::from("foo");
//! {
//!     let t = String::from("bar");
//!     whoo = IndependentStruct{x: &s, y: &t};
//! }
//! println!("{:?}", whoo.x);
//! ```
//! ```compile_fail
//! pub fn independent_lifetimes<'a, 'b, 'c>(x: &'a str, y: &'b str) -> &'c str
//! where
//!     'c: 'a,
//! {
//!     println!("{:?}", y);
//!     x  // x is a 'a, but 'a does not "implement" 'c !!
//! }
//! ```

// 1. 'a represents a single, common lifetime that both &x and &y must be valid for
//   - Rust would infer the shortest lifetime possible that fits those constraints + the constraints
//   induced by the return type
// 2. we return a reference tied to 'a (forced to as we can't statically say which one). So that is
//    the 3rd constraint for 'a
//
// The returned reference is guaranteed to be valid for 'a by definition of a lifetime
pub fn tied_lifetimes<'a>(cond: bool, x: &'a str, y: &'a str) -> &'a str {
    match cond {
        true => x,
        false => y,
    }
}

pub fn independent_lifetimes<'a, 'b, 'c>(x: &'a str, y: &'b str) -> &'c str
where
    'a: 'c,
{
    println!("{:?}", y);
    x
}

#[derive(Debug)]
pub struct IndependentStruct<'a, 'b> {
    pub x: &'a String,
    pub y: &'b String,
}

#[derive(Debug)]
pub struct TiedStruct<'a> {
    pub x: &'a String,
    pub y: &'a String,
}

#[derive(Debug)]
// We implicitly have
// 'a: Self
// 'b: 'a
// 'c: 'a
pub struct ComplexStruct<'a, 'b, 'c>
where
    'b: 'a,
    'c: 'a, // Try 'a: 'b that would force the lifetimes to be perfectly equal?
{
    pub x: &'a IndependentStruct<'b, 'c>,
}

// The `where T: 'a` is optional
// https://rust-lang.github.io/rfcs/2093-infer-outlives.html
#[derive(Debug)]
pub struct Foo<'a, T>
where
    T: 'a,
{
    // If T itself contains references, then they have to outlive the &'a
    // If T dost not contain any references then `T: 'a` is always fulfilled
    myref: &'a T,
}

#[cfg(test)]
mod tests {
    use super::TiedStruct;
    use super::IndependentStruct;
    use super::independent_lifetimes;
    use super::tied_lifetimes;

    #[test]
    fn test_tied_lifetime_can_refer_to_different_lifetimes() {
        let s = String::from("foo");
        {
            let t = String::from("bar");
            tied_lifetimes(true, &s, &t);
            println!("{:?}", t);
        }
        println!("{:?}", s);
    }

    #[test]
    fn test_independent_lifetimes_are_more_flexible() {
        let s = String::from("foo");
        let u: &str;
        {
            let t = String::from("bar");
            u = independent_lifetimes(&s, &t);
        }
        println!("{:?}", u);
    }

    #[test]
    fn test_independent_struct_can_refer_to_different_lifetimes() {
        let s = String::from("foo");
        let u: &str;
        {
            let t = String::from("bar");
            let mystruct = IndependentStruct { x: &s, y: &t };
            u = mystruct.x;
        }
        // OK as Rust knows that mystruct.x is tied to s's lifetime
        // Useful for accessors basically
        println!("{:?}", u);
    }

    #[test]
    fn test_tied_lifetimes_struct() {
        let s = String::from("foo");
        {
            let t = String::from("bar");
            TiedStruct { x: &s, y: &t };
        }
    }
}
