//! ## Generating and manipulating outputs
//!
//! Combinators that manipulate, generate, or combine the output of parsers.

use chumsky::prelude::*;

/*
 *
 * GENERATING AND MANIPULATING OUTPUTS
 *
 */

/// `map` transforms the output of a parser.
pub fn map_parser<'src>() -> impl Parser<'src, &'src str, String> {
    just('a').map(|c| format!("got: {}", c))
}

/// Trying to emulate the <*> megaparsec in Haskell
pub fn applicative_parser<'src>(
    a: char, b: char
) -> impl Parser<'src, &'src str, String> {
    just(a).then(just(b)).map(|(x, y)| format!("{x}{y}"))
}

/// `map_with` provides access to metadata like the span.
pub fn map_with_parser<'src>() -> impl Parser<'src, &'src str, (char, SimpleSpan)> {
    just('a').map_with(|c, extra| (c, extra.span()))
}

/// `to_slice` returns the slice of the input that was matched.
/// Requires inputs that implement `SliceInput` (like `&str`).
pub fn to_slice_parser<'src>() -> impl Parser<'src, &'src str, &'src str> {
    just('a').repeated().at_least(1).to_slice()
}

/// `to` replaces the output with a constant value.
pub fn to_parser<'src>() -> impl Parser<'src, &'src str, i32> {
    just("hello").to(42)
}

/// `ignored` discards the output and returns `()`.
pub fn ignored_parser<'src>() -> impl Parser<'src, &'src str, ()> {
    just("secret").ignored()
}

/// `collect` gathers outputs into a collection (e.g., `Vec`).
pub fn collect_parser<'src>() -> impl Parser<'src, &'src str, Vec<char>> {
    just('a').repeated().collect::<Vec<_>>()
}

/// `collect_exactly` gathers an exact number of outputs into an array.
pub fn collect_exactly_parser<'src>() -> impl Parser<'src, &'src str, [char; 3]> {
    just('a').repeated().collect_exactly::<[_; 3]>()
}

/// `count` returns the number of items matched by an `IterParser`.
pub fn count_parser<'src>() -> impl Parser<'src, &'src str, usize> {
    just('a').repeated().count()
}

/// `unwrapped` unwraps an `Option` or `Result` output.
/// NOTE: In Chumsky 0.13.0, this panics if the value is `None` or `Err`.
pub fn unwrapped_parser<'src>() -> impl Parser<'src, &'src str, char> {
    any().map(|c: char| if c.is_ascii_lowercase() { Some(c) } else { None }).unwrapped()
}

/// `then_with_ctx` allows for monadic-like dependency between parsers (like `>>=` in Haskell, or megaparsec's monad).
/// In Chumsky 0.13.0, this is achieved by passing the output of the first parser as context to the second.
pub fn then_with_parser<'src>() -> impl Parser<'src, &'src str, String> {
    any()
        .filter(|c: &char| c.is_ascii_digit())
        .map(|c| c.to_digit(10).unwrap() as usize)
        .then_with_ctx(
            just('a')
                .repeated()
                .configure(|cfg, n: &usize| cfg.exactly(*n))
                .collect::<String>()
        )
        .map(|(_n, s)| s)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_map_parser() {
        assert_eq!(map_parser().parse("a").into_result(), Ok("got: a".to_string()));
    }

    #[test]
    fn test_applicative_parser() {
        assert_eq!(
            applicative_parser('m', 'n').parse("mn").into_result(),
            Ok("mn".to_string())
        );
        assert!(
            applicative_parser('m', 'n').parse("mo").has_errors()
        )
    }

    #[test]
    fn test_map_with_parser() {
        let (c, span) = map_with_parser().parse("a").into_result().unwrap();
        assert_eq!(c, 'a');
        assert_eq!(span.start, 0);
        assert_eq!(span.end, 1);
    }

    #[test]
    fn test_to_slice_parser() {
        assert_eq!(to_slice_parser().parse("aaa").into_result(), Ok("aaa"));
    }

    #[test]
    fn test_to_parser() {
        assert_eq!(to_parser().parse("hello").into_result(), Ok(42));
    }

    #[test]
    fn test_ignored_parser() {
        assert_eq!(ignored_parser().parse("secret").into_result(), Ok(()));
    }

    #[test]
    fn test_collect_parser() {
        assert_eq!(collect_parser().parse("aaa").into_result(), Ok(vec!['a', 'a', 'a']));
    }

    #[test]
    fn test_collect_exactly_parser() {
        assert_eq!(collect_exactly_parser().parse("aaa").into_result(), Ok(['a', 'a', 'a']));
        assert!(collect_exactly_parser().parse("aa").has_errors());
        assert!(collect_exactly_parser().parse("aaaa").has_errors());
    }

    #[test]
    fn test_count_parser() {
        assert_eq!(count_parser().parse("aaa").into_result(), Ok(3));
        assert_eq!(count_parser().parse("").into_result(), Ok(0));
    }

    #[test]
    fn test_unwrapped_parser() {
        assert_eq!(unwrapped_parser().parse("a").into_result(), Ok('a'));

        // Demonstrating that unwrapped() panics on None
        let result = std::panic::catch_unwind(|| {
            let _ = unwrapped_parser().parse("A").into_result();
        });
        assert!(result.is_err());
    }

    #[test]
    fn test_then_with_parser() {
        assert_eq!(then_with_parser().parse("3aaa").into_result(), Ok("aaa".to_string()));
        assert_eq!(then_with_parser().parse("0").into_result(), Ok("".to_string()));
        assert!(then_with_parser().parse("2a").has_errors());
    }
}
