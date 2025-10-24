use chumsky::prelude::*;

pub fn parser<'src>() -> impl Parser<'src, &'src str, ()> {
    end()
}

pub fn another_parser<'src>() -> impl Parser<'src, &'src str, ()> {
    just("vinh").then(just("chuc")).map(|_| ())
}

pub fn flat_arithmetic_expression<'src>() -> impl Parser<'src, &'src str, u32> {
    let int = text::int(10).from_str().unwrapped();
    int.clone()
        .foldl(just('+').ignore_then(int).repeated(), |a, b| a + b)
}

mod tests {
    use super::*;

    #[test]
    fn test_parser() {
        // Our parser expects empty strings, so this should parse successfully
        assert_eq!(parser().parse("").into_result(), Ok(()));

        // Anything other than an empty string should produce an error
        assert!(parser().parse("123").has_errors());
    }

    #[test]
    fn test_another_parser() {
        // Our parser expects empty strings, so this should parse successfully
        assert_eq!(another_parser().parse("vinhchuc").into_result(), Ok(()));
        assert!(another_parser().parse("123").has_errors());
        assert!(another_parser().parse("vinh").has_errors());
    }

    #[test]
    fn test_flat_arithmetic_expresssions() {
        assert_eq!(
            flat_arithmetic_expression().parse("10").into_result(),
            Ok(10)
        );
        assert_eq!(
            flat_arithmetic_expression().parse("10+10").into_result(),
            Ok(20)
        );

        // Does not cope with white spaces
        assert!(flat_arithmetic_expression().parse("10+ 10").has_errors());
    }
}
