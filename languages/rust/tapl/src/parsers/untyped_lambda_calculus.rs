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
        let var = select! { Token::Var(v) => Expr::Var(v) };

        let atom = var.or(term.clone().delimited_by(just(Token::LParen), just(Token::RParen)));

        let abs = just(Token::Lambda)
            .ignore_then(select! { Token::Var(v) => v })
            .then_ignore(just(Token::Dot))
            .then(term)
            .map(|(v, body)| Expr::Abs(v, Box::new(body)));

        let app = atom.clone()
            .foldl(atom.repeated(), |f, arg| Expr::App(Box::new(f), Box::new(arg)));

        abs.or(app)
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_lambda_calculus::lexer;

    #[test]
    fn test_parser_precedence() {
        let cases = [
            // Greedy abstraction
            (r"\x. x y", "Abs(\"x\", App(Var(\"x\"), Var(\"y\")))"),
            // Left-associative application
            ("x y z", "App(App(Var(\"x\"), Var(\"y\")), Var(\"z\"))"),
            // Parentheses override
            (r"(\x. x) y", "App(Abs(\"x\", Var(\"x\")), Var(\"y\"))"),
            ("x (y z)", "App(Var(\"x\"), App(Var(\"y\"), Var(\"z\")))"),
        ];

        for (src, expected) in cases {
            let tokens = lexer().parse(src).into_result().unwrap();
            let ast = parser().parse(&tokens).into_result().unwrap();
            assert_eq!(format!("{:?}", ast), expected, "Failed on: {}", src);
        }
    }
}
