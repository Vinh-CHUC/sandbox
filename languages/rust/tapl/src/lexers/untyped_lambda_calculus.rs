use chumsky::prelude::*;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Token {
    Lambda,
    Dot,
    Var(String),
}

pub fn lexer<'src>() -> impl Parser<'src, &'src str, Vec<Token>, extra::Err<Rich<'src, char>>> {
    let token = choice((
        choice((
            just('\\').ignored(),
            text::keyword("lambda").ignored(),
        ))
        .to(Token::Lambda),
        just('.').to(Token::Dot),
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
        let src = r"lambda x. \y. \ z. x y z";
        let tokens = lexer().parse(src).into_result().unwrap();
        assert_eq!(
            tokens,
            vec![
                Token::Lambda,
                Token::Var("x".to_string()),
                Token::Dot,
                Token::Lambda,
                Token::Var("y".to_string()),
                Token::Dot,
                Token::Lambda,
                Token::Var("z".to_string()),
                Token::Dot,
                Token::Var("x".to_string()),
                Token::Var("y".to_string()),
                Token::Var("z".to_string()),
            ]
        );
    }
}
