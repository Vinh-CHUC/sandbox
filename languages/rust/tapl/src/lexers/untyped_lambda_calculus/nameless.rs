use chumsky::prelude::*;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Token {
    Lambda,
    Dot,
    Var(u32),
    OpenParen,
    CloseParen,
}

pub fn lexer<'src>() -> impl Parser<'src, &'src str, Vec<Token>, extra::Err<Rich<'src, char>>> {
    let token = choice((
        choice((
            just('\\').ignored(),
            text::keyword("lambda").ignored(),
        ))
        .to(Token::Lambda),
        just('.').to(Token::Dot),
        just('(').to(Token::OpenParen),
        just(')').to(Token::CloseParen),
        text::int(10).try_map(|s: &str, span| {
            s.parse::<u32>()
                .map(Token::Var)
                .map_err(|e| Rich::custom(span, e.to_string()))
        }),
    ));

    token
        .padded()
        .repeated()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nameless_lexer() {
        let src = r"lambda. \ . (0 1) 2";
        let tokens = lexer().parse(src).into_result().unwrap();
        assert_eq!(
            tokens,
            vec![
                Token::Lambda,
                Token::Dot,
                Token::Lambda,
                Token::Dot,
                Token::OpenParen,
                Token::Var(0),
                Token::Var(1),
                Token::CloseParen,
                Token::Var(2),
            ]
        );
    }

    #[test]
    fn test_nameless_lexer_overflow() {
        // 4294967296 is u32::MAX + 1, which will overflow u32
        let src = "4294967296";
        let res = lexer().parse(src);
        assert!(res.has_errors());
    }
}
