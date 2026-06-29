use chumsky::prelude::*;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Expr {
    Var(String),
    Abs(String, Box<Expr>),
    App(Box<Expr>, Box<Expr>),
}

use super::super::lexers::untyped_lambda_calculus::Token;

pub fn parser<'src>() -> impl Parser<'src, &'src [Token], Expr, extra::Err<Rich<'src, Token>>> {
    recursive(|term| {
        // Roughly equivalent to
        // any().try_map(|..| match {} )
        let var = select! { Token::Var(v) => Expr::Var(v) };

        let abs = just(Token::Lambda)
            .ignore_then(select! { Token::Var(v) => v })
            .then_ignore(just(Token::Dot))
            .then(term.clone())
            .map(|(v, body)| Expr::Abs(v, Box::new(body)));

        let atom = var.or(abs);

        atom.clone().foldl(
            atom.repeated(),
            |a, b| Expr::App(Box::new(a), Box::new(b))
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_lambda_calculus::lexer;

    fn v(s: &str) -> Expr {
        Expr::Var(s.to_string())
    }

    fn abs(s: &str, e: Expr) -> Expr {
        Expr::Abs(s.to_string(), Box::new(e))
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
        assert!(try_parse_src(r"\x. x").is_ok());
        assert!(try_parse_src(r"\x. \y. x y").is_ok());
        assert!(try_parse_src(r"\x. x y").is_ok());

        // These wouldn't eval correctly but are valid as far as the parser is concerned
        assert!(try_parse_src("x").is_ok());
        assert!(try_parse_src("x y").is_ok());
        assert!(try_parse_src(r"x \y. y").is_ok());
    }

    #[test]
    fn test_nested_abs_app_precedence() {
        assert_eq!(
            parse_src(r"\x. \y. \z. x y z"),
            abs("x",
                abs("y",
                    abs("z",
                        // Application is left associative
                        app(app(v("x"), v("y")), v("z"))
                    )
                )
            )
        );

        assert_eq!(
            parse_src(r"\x. x \y. y"),
            abs("x",
                app(v("x"), abs("y", v("y")))
            )
        );
    }

    #[test]
    fn test_abs_body_precedence() {
        assert_eq!(parse_src(r"\x. x y"), abs("x", app(v("x"), v("y"))));
    }
}
