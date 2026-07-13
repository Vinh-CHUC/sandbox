use chumsky::prelude::*;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Expr {
    Var(u32),
    Abs(Box<Expr>),
    App(Box<Expr>, Box<Expr>),
}

use crate::lexers::untyped_lambda_calculus::nameless::Token;

pub fn parser<'src>() -> impl Parser<'src, &'src [Token], Expr, extra::Err<Rich<'src, Token>>> {
    recursive(|term| {
        let var = select! { Token::Var(v) => Expr::Var(v) };

        let abs = just(Token::Lambda)
            .then_ignore(just(Token::Dot))
            .then(term.clone())
            .map(|(_, body)| Expr::Abs(Box::new(body)));

        let atom = var
            .or(abs)
            .or(term.clone().delimited_by(
                just(Token::OpenParen),
                just(Token::CloseParen),
            ));

        atom.clone().foldl(
            atom.repeated(),
            |a, b| Expr::App(Box::new(a), Box::new(b))
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_lambda_calculus::nameless::lexer;

    fn v(u: u32) -> Expr {
        Expr::Var(u)
    }

    fn abs(e: Expr) -> Expr {
        Expr::Abs(Box::new(e))
    }

    fn app(e1: Expr, e2: Expr)-> Expr {
        Expr::App(Box::new(e1), Box::new(e2))
    }

    fn parse_src(src: &str) -> Expr {
        let tokens = lexer().parse(src).into_result().unwrap();
        parser().parse(&tokens).into_result().unwrap()
    }

    fn try_parse_src(src: &str) -> Result<Expr, ()> {
        let tokens = lexer().parse(src).into_result().map_err(|_| ())?;
        parser().parse(&tokens).into_result().map_err(|_| ())
    }

    #[test]
    fn test_basics() {
        assert!(try_parse_src(r"\. 0").is_ok());
        assert!(try_parse_src(r"\. \. 1 0").is_ok());
        assert!(try_parse_src(r"\. 0 1").is_ok());

        assert!(try_parse_src("0").is_ok());
        assert!(try_parse_src("0 1").is_ok());
        assert!(try_parse_src(r"0 \. 0").is_ok());
    }

    #[test]
    fn test_nested_abs_app_precedence() {
        // A bit more difficult to see compared to lambda calculus with names:
        // The lambdas extend all the way to the right: "0" refers to the very first lambda
        assert_eq!(
            parse_src(r"\. \. \. 2 1 0"),
            abs(
                abs(
                    abs(
                        app(app(v(2), v(1)), v(0))
                    )
                )
            )
        );

        assert_eq!(
            parse_src(r"\. 0 \. 0"),
            abs(
                app(v(0), abs(v(0)))
            )
        );
    }

    #[test]
    fn test_abs_body_precedence() {
        assert_eq!(parse_src(r"\. 0 1"), abs(app(v(0), v(1))));
    }

    #[test]
    fn test_parentheses() {
        assert_eq!(
            parse_src(r"(0 1) 2"),
            app(app(v(0), v(1)), v(2))
        );

        assert_eq!(
            parse_src(r"0 (1 2)"),
            app(v(0), app(v(1), v(2)))
        );

        assert_eq!(
            parse_src(r"(\. 0) 1"),
            app(abs(v(0)), v(1))
        );

        assert_eq!(
            parse_src(r"(\. 0) (\. \. 0 0)"),
            app(
                abs(v(0)),
                abs(
                    abs(
                        app(v(0), v(0))
                    )
                )
            )
        );
    }
}
