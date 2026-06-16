use chumsky::prelude::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Expr {
    True,
    False,
    If{
        r#if: Box<Expr>,
        r#then: Box<Expr>,
        r#else: Box<Expr>,
    },
    Zero,
    Succ(Box<Expr>),
    Pred(Box<Expr>),
    IsZero(Box<Expr>),
}

use super::super::lexers::untyped_arithmetic::Token;

pub fn parser<'src>()
-> impl Parser<'src, &'src [Token], Expr, extra::Err<Rich<'src, Token>>> {
    recursive(|rec| {
        choice((
            just(Token::False).to(Expr::False),
            just(Token::True).to(Expr::True),
            just(Token::Zero).to(Expr::Zero),
            just(Token::If)
                .ignore_then(rec.clone())
                .then_ignore(just(Token::Then))
                .then(rec.clone())
                .then_ignore(just(Token::Else))
                .then(rec.clone())
                .map(|((r#if, r#then), r#else)| {
                    // We have to Box::new here because the parser (and hence the recursive one)
                    // Return a naked Expr, not a boxed one
                    Expr::If {
                        r#if: Box::new(r#if),
                        r#then: Box::new(r#then),
                        r#else: Box::new(r#else),
                    }
                }),
            just(Token::Succ).ignore_then(rec.clone()).map(|e| Expr::Succ(Box::new(e))),
            just(Token::Pred).ignore_then(rec.clone()).map(|e| Expr::Pred(Box::new(e))),
            just(Token::IsZero).ignore_then(rec.clone()).map(|e| Expr::IsZero(Box::new(e))),
        ))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_arithmetic::lexer;

    #[test]
    fn test_parser() {
        let src = "if iszero succ 0 then true else false";
        let tokens = lexer().parse(src).into_result().unwrap();
        let ast = parser().parse(&tokens).into_result().unwrap();

        assert_eq!(
            ast,
            Expr::If {
                r#if: Box::new(Expr::IsZero(Box::new(Expr::Succ(Box::new(Expr::Zero))))),
                r#then: Box::new(Expr::True),
                r#else: Box::new(Expr::False),
            }
        );
    }
}
