use chumsky::prelude::*;

/*
 *
 * COMBINATORS
 *
 */

pub fn then_parser<'src>() -> impl Parser<'src, &'src str, (char, char)> {
    just('a').then(just('b'))
}

/// The `or` combinator requires both parsers to have the same output type.
/// The following will fail to compile because one parser outputs `char` and the other outputs `&str`.
///
/// ```compile_fail
/// use chumsky::prelude::*;
/// let parser = just('a').or(just("bc"));
/// ```
pub fn or_parser<'src>() -> impl Parser<'src, &'src str, char> {
    just('a').or(just('b'))
}

pub fn ignore_then_parser<'src>() -> impl Parser<'src, &'src str, char> {
    just("ab").ignore_then(just('b'))
}

pub fn then_ignore_parser<'src>() -> impl Parser<'src, &'src str, char> {
    just('a').then_ignore(just('b'))
}

pub fn delimited_by_parser<'src>() -> impl Parser<'src, &'src str, char> {
    just('b').delimited_by(just('('), just(')'))
}

pub fn padded_by_parser<'src>() -> impl Parser<'src, &'src str, char> {
    just('a').padded_by(just(' '))
}

pub fn repeated_parser<'src>() -> impl Parser<'src, &'src str, Vec<char>> {
    just('a').repeated().collect::<Vec<_>>()
}

pub fn separated_by_parser<'src>() -> impl Parser<'src, &'src str, Vec<char>> {
    just('a').separated_by(just(',')).collect::<Vec<_>>()
}

pub fn or_not_parser<'src>() -> impl Parser<'src, &'src str, Option<char>> {
    just('a').or_not()
}

pub fn foldl_parser<'src>() -> impl Parser<'src, &'src str, i32> {
    just('1')
        .to(1)
        .foldl(just('+').ignore_then(just('1').to(1)).repeated(), |a, b| {
            a + b
        })
}

pub fn foldr_parser<'src>() -> impl Parser<'src, &'src str, i32> {
    just('1')
        .to(1)
        .repeated()
        .foldr(just('0').to(0), |a, b| a + b + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_then_parser() {
        assert_eq!(then_parser().parse("ab").into_result(), Ok(('a', 'b')));
        assert!(then_parser().parse("ax").has_errors());
    }

    #[test]
    fn test_or_parser() {
        assert_eq!(or_parser().parse("a").into_result(), Ok('a'));
        assert_eq!(or_parser().parse("b").into_result(), Ok('b'));
        assert!(or_parser().parse("c").has_errors());
    }

    #[test]
    fn test_ignore_then_parser() {
        assert_eq!(ignore_then_parser().parse("abb").into_result(), Ok('b'));
        assert!(ignore_then_parser().parse("ax").has_errors());
    }

    #[test]
    fn test_then_ignore_parser() {
        assert_eq!(then_ignore_parser().parse("ab").into_result(), Ok('a'));
        assert!(then_ignore_parser().parse("ax").has_errors());
    }

    #[test]
    fn test_delimited_by_parser() {
        assert_eq!(delimited_by_parser().parse("(b)").into_result(), Ok('b'));
        assert!(delimited_by_parser().parse("b").has_errors());
        assert!(delimited_by_parser().parse("(b").has_errors());
    }

    #[test]
    fn test_padded_by_parser() {
        assert_eq!(padded_by_parser().parse(" a ").into_result(), Ok('a'));
        assert!(padded_by_parser().parse("a").has_errors());
        // Has to be exactly one on each side
        assert!(padded_by_parser().parse("  a  ").has_errors());
    }

    #[test]
    fn test_repeated_parser() {
        assert_eq!(
            repeated_parser().parse("aaa").into_result(),
            Ok(vec!['a', 'a', 'a'])
        );
        assert_eq!(repeated_parser().parse("").into_result(), Ok(vec![]));
    }

    #[test]
    fn test_separated_by_parser() {
        assert_eq!(
            separated_by_parser().parse("a,a,a").into_result(),
            Ok(vec!['a', 'a', 'a'])
        );
        assert_eq!(
            separated_by_parser().parse("a").into_result(),
            Ok(vec!['a'])
        );
        assert_eq!(separated_by_parser().parse("").into_result(), Ok(vec![]));
    }

    #[test]
    fn test_or_not_parser() {
        assert_eq!(or_not_parser().parse("a").into_result(), Ok(Some('a')));
        assert_eq!(or_not_parser().parse("").into_result(), Ok(None));
    }

    #[test]
    fn test_foldl_parser() {
        assert_eq!(foldl_parser().parse("1+1+1").into_result(), Ok(3));
        assert_eq!(foldl_parser().parse("1").into_result(), Ok(1));
    }

    #[test]
    fn test_foldr_parser() {
        // "110" -> 1 + (1 + 0 + 1) + 1 = 4?
        // foldr logic: a.repeated().foldr(b, f)
        // input "110":
        // parsed '1', '1' from repeated()
        // parsed '0' from b
        // f('1', f('1', 0))
        // f('1', 0) = 1 + 0 + 1 = 2
        // f('1', 2) = 1 + 2 + 1 = 4
        assert_eq!(foldr_parser().parse("110").into_result(), Ok(4));
        assert_eq!(foldr_parser().parse("0").into_result(), Ok(0));
    }
}
