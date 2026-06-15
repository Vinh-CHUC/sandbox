//! ## Infinite parser
//!
//! ### Issue 1 fails to compile
//! the output type of then(infinite_parser()) is something like:
//! (str, typeof(infinite_parser))
//! (str, str, typeof(infinite_parser))
//! (str, str, str, typeof(infinite_parser)) ...
//!
//! ### Issue 2 infinite recursion at runtime
//! It would fail to run anyway given that there is a plain infinite recursion!
//!
//! ```compile_fail
//! use chumsky::prelude::*;
//!
//! pub fn infinite_parser<'src>() -> impl Parser<'src, &'src str, String> {
//!     just("yo").then(infinite_parser()).map(|(x, y)| format!("{x}{y}"))
//! }
//! ```
//!
//! Another similar example (meant to parse something like 4 + (1 + 2) + 3
//! ```compile_fail
//! fn a_parser<'src>() -> impl Parser<'src, &'src str, i32> + Clone {
//!     let int = text::int(10).map(|s: &str| s.parse().unwrap());
//!
//!     let atom = choice((
//!         int,
//!         a_parser().delimited_by(just('('), just(')')),
//!     ))
//!         .padded();
//!
//!     atom.clone().foldl(
//!         just('+').padded().ignore_then(atom).repeated(),
//!         |lhs, rhs| lhs + rhs,
//!     )
//! }
//! ```

use chumsky::prelude::*;

// This compiles would recurse infinitely at runtime
// pub fn broken_infinite_parser<'src>() -> impl Parser<'src, &'src str, String> {
//     just("yo").then(broken_infinite_parser().boxed()).map(|(x, y)| format!("{x}{y}"))
// }

// Solution for the simple infinite_parser
pub fn infinite_parser<'src>() -> impl Parser<'src, &'src str, String> {
    recursive(|p| {
        just("yo")
            .then(p)
            .map(|(x, y)| format!("{x}{y}"))
            .or(just("yo").map(|s| s.to_string()))
    })
}

// Solution for the 4 + (1 + 2) + 3
pub fn a_parser<'src>() -> impl Parser<'src, &'src str, i32> + Clone {
    recursive(|a_parser| {
        let int = text::int(10).map(|s: &str| s.parse().unwrap());

        let atom = choice((int, a_parser.delimited_by(just('('), just(')')))).padded();

        atom.clone().foldl(
            just('+').padded().ignore_then(atom).repeated(),
            |lhs, rhs| lhs + rhs,
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recursive() {
        assert!(!infinite_parser().parse("yo").has_errors());
        assert!(!infinite_parser().parse("yoyo").has_errors());
    }

    #[test]
    fn test_recursive_arith_parser() {
        assert_eq!(a_parser().parse("2 + (1 + 3)").into_result(), Ok(6));
        assert_eq!(a_parser().parse("2 + 1 + 3").into_result(), Ok(6));
    }
}
