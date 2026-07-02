use std::collections::HashSet;

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

pub fn free_vars_rec<'a>(expr: &'a Expr, fvs: &mut HashSet<&'a str>) {
    match expr {
        Expr::Var(s) => {
            // We need the lifetime annotation here
            // As Rust equires the lifetime of a.as_str outlives fvs
            fvs.insert(s.as_str());
            ()
        }
        Expr::Abs(s, expr) => {
            free_vars_rec(expr, fvs);
            fvs.remove(s.as_str());
        },
        Expr::App(t1, t2) => {
            free_vars_rec(t1, fvs);
            free_vars_rec(t2, fvs);
        }
    };
}

pub fn free_vars(expr: &Expr) -> HashSet<&str> {
    let mut fvs = HashSet::new();
    free_vars_rec(expr, &mut fvs);
    fvs
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

    #[test]
    fn test_free_vars() {
        // Simple free variable
        assert_eq!(
            free_vars(&parse_src(r"\x. y")),
            HashSet::from(["y"])
        );

        // Multiple free variables in an application
        assert_eq!(
            free_vars(&parse_src(r"\x. x y z")),
            HashSet::from(["y", "z"])
        );

        // Shadowing with nested lambda
        assert_eq!(
            free_vars(&parse_src(r"\x. \x. x y")),
            HashSet::from(["y"])
        );

        // Closed term (no free variables)
        assert_eq!(
            free_vars(&parse_src(r"\x. \y. x")),
            HashSet::new()
        );
    }

    #[test]
    fn test_parentheses() {
        assert_eq!(
            parse_src(r"(x y) z"),
            app(app(v("x"), v("y")), v("z"))
        );

        assert_eq!(
            parse_src(r"x (y z)"),
            app(v("x"), app(v("y"), v("z")))
        );

        assert_eq!(
            parse_src(r"(\x. x) y"),
            app(abs("x", v("x")), v("y"))
        );
    }
}
