//! ```compile_fail
//! use playground::lifetimes::*;
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
//! ```compile_fail
//! use playground::lifetimes::*;
//! let s = String::from("foo");
//! let ts: TiedStruct;
//! {
//!     let t = String::from("bar");
//!     ts = TiedStruct{x: &s, y: &t};
//! }
//! println!("{:?}", ts); 
//! ```

pub fn tied_lifetimes<'a>(cond: bool, x: &'a str, y: &'a str) -> &'a str {
    match cond {
        true => x,
        false => y
    }
}

pub fn independent_lifetimes<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    println!("{:?}", y);
    x
}

#[derive(Debug)]
pub struct TiedStruct<'a, 'b> {
    pub x: &'a String,
    pub y: &'b String,
}

#[derive(Debug)]
struct IndependentStruct<'a> {
    x: &'a String,
    y: &'a String,
}


#[cfg(test)]
mod tests {
    use super::tied_lifetimes;
    use super::independent_lifetimes;
    use super::TiedStruct;

    #[test]
    fn test_tied_lifetime_can_refer_to_different_lifetimes() {
        let s = String::from("foo");
        {
            let t = String::from("bar");
            tied_lifetimes(true, &s, &t);
        }
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
    fn test_tied_struct_can_refer_to_different_lifetimes() {
        let s = String::from("foo");
        {
            let t = String::from("bar");
            TiedStruct{x: &s, y: &t};
        }
    }
}
