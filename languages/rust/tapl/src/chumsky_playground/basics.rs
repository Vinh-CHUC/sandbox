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
}
