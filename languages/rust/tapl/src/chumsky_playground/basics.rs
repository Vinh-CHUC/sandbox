//! ## Input trait
//!
//! Compared to normal iterator allows backtracking
//!
//! ### Fails to compile: Owned string as input with 'src lifetime
//! ```compile_fail
//! use chumsky::prelude::*;
//! // Input String does not implement Input<'src> for this lifetime
//! fn failing_parser<'src>() -> impl Parser<'src, String, ()> {
//!     end()
//! }
//! ```
//!
//! ### Fails to compile: Type mismatch (passing String instead of &str)
//! ```compile_fail
//! use tapl::chumsky_playground::basics::noop_parser;
//! use chumsky::Parser;
//! let s = String::from("input");
//! // noop_parser expects &'src str, but we passed a String
//! let _ = noop_parser().parse(s);
//! ```

use chumsky::prelude::*;

/*
 *
 * PRIMITIVES
 *
 */

// 'src : lifetime of the input
// &'src str : the input type
// (): output type
pub fn noop_parser<'src>() -> impl Parser<'src, &'src str, ()>{
    end()
}

// just
//
// The output type of the parser is basically Just<T> where T is the input to just(seq: T)
pub fn just_char_parser<'src>() -> impl Parser<'src, &'src str, char> {
    just('h')
}

pub fn just_str_parser<'src>() -> impl Parser<'src, &'src str, &'src str> {
    just("hello")
}

pub fn none_of_parser<'src>() -> impl Parser<'src, &'src str, char> {
    none_of("abc")
}

pub fn one_of_parser<'src>() -> impl Parser<'src, &'src str, char> {
    one_of("abc")
}

pub fn any_parser<'src>() -> impl Parser<'src, &'src str, char> {
    any()
}

pub fn end_parser<'src>() -> impl Parser<'src, &'src str, ()> {
    end()
}

pub fn empty_parser<'src>() -> impl Parser<'src, &'src str, ()> {
    empty()
}

pub fn choice_parser<'src>() -> impl Parser<'src, &'src str, &'src str> {
    choice((just("hello"), just("goodbye")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_noop_parser(){
        assert_eq!(noop_parser().parse("").into_result(), Ok(()));
        assert!(noop_parser().parse("yo").has_errors());
    }

    #[test]
    fn test_just_parsers() {
        assert_eq!(just_char_parser().parse("h").into_result(), Ok('h'));
        assert_eq!(just_str_parser().parse("hello").into_result(), Ok("hello"));

        assert!(just_char_parser().parse("x").has_errors());
        assert!(just_str_parser().parse("world").has_errors());
    }

    #[test]
    fn test_none_of_parser() {
        assert_eq!(none_of_parser().parse("d").into_result(), Ok('d'));
        assert!(none_of_parser().parse("a").has_errors());
    }

    #[test]
    fn test_one_of_parser() {
        assert_eq!(one_of_parser().parse("a").into_result(), Ok('a'));
        assert_eq!(one_of_parser().parse("b").into_result(), Ok('b'));
        assert!(one_of_parser().parse("d").has_errors());
    }

    #[test]
    fn test_any_parser() {
        assert_eq!(any_parser().parse("a").into_result(), Ok('a'));
        assert_eq!(any_parser().parse("z").into_result(), Ok('z'));
        assert!(any_parser().parse("").has_errors());
    }

    #[test]
    fn test_end_parser() {
        assert_eq!(end_parser().parse("").into_result(), Ok(()));
        assert!(end_parser().parse("a").has_errors());
    }

    #[test]
    fn test_empty_parser() {
        assert_eq!(empty_parser().parse("").into_result(), Ok(()));
        // empty() consumes nothing, so .parse("a") fails because it expects to reach the end of input
        assert!(empty_parser().parse("a").has_errors());
    }

    #[test]
    fn test_choice_parser() {
        assert_eq!(choice_parser().parse("hello").into_result(), Ok("hello"));
        assert_eq!(choice_parser().parse("goodbye").into_result(), Ok("goodbye"));
        assert!(choice_parser().parse("ciao").has_errors());
    }
}
