//! ## Input trait
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

// 'src : lifetime of the input
// &'src str : the input type
// (): output type
pub fn noop_parser<'src>() -> impl Parser<'src, &'src str, ()>{
    end()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_noop_parser(){
        assert_eq!(noop_parser().parse("").into_result(), Ok(()));
        assert!(noop_parser().parse("yo").has_errors());
    }
}
