use chumsky::prelude::*;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Token {
    Lambda,
    Dot,
    Colon,
    Arrow,
    OpenParen,
    CloseParen,
    True,
    False,
    If,
    Then,
    Else,
    Bool,
    Var(String),
}

pub fn lexer<'src>() -> impl Parser<'src, &'src str, Vec<Token>, extra::Err<Rich<'src, char>>> {
    let token = choice((
        // ignored() yields ()
        choice((
            just('\\').ignored(),
            text::keyword("lambda").ignored(),
        ))
        .to(Token::Lambda),
        just("->").to(Token::Arrow),
        just(':').to(Token::Colon),
        just('.').to(Token::Dot),
        just('(').to(Token::OpenParen),
        just(')').to(Token::CloseParen),
        text::keyword("true").to(Token::True),
        text::keyword("false").to(Token::False),
        text::keyword("if").to(Token::If),
        text::keyword("then").to(Token::Then),
        text::keyword("else").to(Token::Else),

        // types are hardcoded atm
        text::keyword("Bool").to(Token::Bool),

        text::ident().map(|s: &str| Token::Var(s.to_string())),
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
    fn test_lexer() {
        let src = r"\x:Bool->Bool. if true then x else false";
        let tokens = lexer().parse(src).into_result().unwrap();
        assert_eq!(
            tokens,
            vec![
                Token::Lambda,
                Token::Var("x".to_string()),
                Token::Colon,
                Token::Bool,
                Token::Arrow,
                Token::Bool,
                Token::Dot,
                Token::If,
                Token::True,
                Token::Then,
                Token::Var("x".to_string()),
                Token::Else,
                Token::False,
            ]
        );

        // Keywords take precedence over idents but respect word boundaries
        assert_eq!(
            lexer().parse("iffy else").into_result().unwrap(),
            vec![Token::Var("iffy".to_string()), Token::Else]
        );
    }
}
