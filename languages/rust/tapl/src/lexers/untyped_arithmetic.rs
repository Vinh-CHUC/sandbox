use chumsky::prelude::*;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Token {
    True,
    False,
    If,
    Then,
    Else,
    Succ,
    Pred,
    Zero,
    IsZero,
}

pub fn lexer<'src>() -> impl Parser<'src, &'src str, Vec<Token>, extra::Err<Rich<'src, char>>> {
    let token = choice((
        // text::keyword => has to respect word boundaries
        text::keyword("true").to(Token::True),
        text::keyword("false").to(Token::False),
        text::keyword("if").to(Token::If),
        text::keyword("then").to(Token::Then),
        text::keyword("else").to(Token::Else),
        text::keyword("succ").to(Token::Succ),
        text::keyword("pred").to(Token::Pred),
        just("0").to(Token::Zero),
        text::keyword("iszero").to(Token::IsZero),
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
        let src = "if iszero succ 0 then true else false";
        let tokens = lexer().parse(src).into_result().unwrap();
        assert_eq!(
            tokens,
            vec![
                Token::If,
                Token::IsZero,
                Token::Succ,
                Token::Zero,
                Token::Then,
                Token::True,
                Token::Else,
                Token::False,
            ]
        );
    }

    #[test]
    fn test_lexer_failure() {
        let src = "if iszero succ 5 lkjsdf";
        let tokens = lexer().parse(src);
        assert!(tokens.has_errors());
    }
}
