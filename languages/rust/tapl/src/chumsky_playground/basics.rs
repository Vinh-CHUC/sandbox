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
pub fn noop_parser<'src>() -> impl Parser<'src, &'src str, ()> {
    end()
}

// just
//
// The output type of the parser depends on the pattern:
// - just(char) -> Parser<..., char>
// - just(&str) -> Parser<..., &str>
pub fn just_char_parser<'src>(c: char) -> impl Parser<'src, &'src str, char> {
    just(c)
}

pub fn just_str_parser<'src>(s: &'src str) -> impl Parser<'src, &'src str, &'src str> {
    just(s)
}

pub fn none_of_parser<'src>(s: &'src str) -> impl Parser<'src, &'src str, char> {
    none_of(s)
}

pub fn one_of_parser<'src>(s: &'src str) -> impl Parser<'src, &'src str, char> {
    one_of(s)
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

pub fn choice_parser<'src>(
    s1: &'src str,
    s2: &'src str,
) -> impl Parser<'src, &'src str, &'src str> {
    choice((just(s1), just(s2)))
}

/// Possible but inefficient: Using an owned String as a pattern.
/// The output type becomes String, and it clones the pattern on every match.
pub fn owned_string_pattern_parser(s: String) -> impl Parser<'static, &'static str, String> {
    just(s)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_noop_parser() {
        assert_eq!(noop_parser().parse("").into_result(), Ok(()));
        assert!(noop_parser().parse("yo").has_errors());
    }

    #[test]
    fn test_just_parsers() {
        assert_eq!(just_char_parser('h').parse("h").into_result(), Ok('h'));
        assert_eq!(
            just_str_parser("hello").parse("hello").into_result(),
            Ok("hello")
        );

        assert!(just_char_parser('h').parse("x").has_errors());
        assert!(just_str_parser("hello").parse("world").has_errors());
    }

    #[test]
    fn test_none_of_parser() {
        assert_eq!(none_of_parser("abc").parse("d").into_result(), Ok('d'));
        assert!(none_of_parser("abc").parse("a").has_errors());
    }

    #[test]
    fn test_one_of_parser() {
        assert_eq!(one_of_parser("abc").parse("a").into_result(), Ok('a'));
        assert_eq!(one_of_parser("abc").parse("b").into_result(), Ok('b'));
        assert!(one_of_parser("abc").parse("d").has_errors());
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
        assert_eq!(
            choice_parser("hello", "goodbye")
                .parse("hello")
                .into_result(),
            Ok("hello")
        );
        assert_eq!(
            choice_parser("hello", "goodbye")
                .parse("goodbye")
                .into_result(),
            Ok("goodbye")
        );
        assert!(choice_parser("hello", "goodbye").parse("ciao").has_errors());
    }

    #[test]
    fn test_owned_string_pattern() {
        let pattern = String::from("owned");
        // Note: The parser now returns a String, not a &str
        assert_eq!(
            owned_string_pattern_parser(pattern)
                .parse("owned")
                .into_result(),
            Ok(String::from("owned"))
        );
    }
}
