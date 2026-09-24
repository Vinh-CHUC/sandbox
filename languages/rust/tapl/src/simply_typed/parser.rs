use chumsky::prelude::*;

use crate::simply_typed::checker::Ty;
use crate::simply_typed::lexer::Token;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum NamedTerm {
    Var(String),
    Abs(String, Ty, Box<NamedTerm>),
    App(Box<NamedTerm>, Box<NamedTerm>),
    True,
    False,
    If(Box<NamedTerm>, Box<NamedTerm>, Box<NamedTerm>)
}

pub fn parser<'src>() -> impl Parser<'src, &'src [Token], NamedTerm, extra::Err<Rich<'src, Token>>> {
    recursive(|term| {
        // Type grammar:
        // - Bool
        // - Bool -> (Bool)
        // - Bool -> (B -> ...)
        let ty = recursive(|ty| {
            let atom = just(Token::Bool)
                .to(Ty::BOOLEAN)
                .or(ty.clone().delimited_by(just(Token::OpenParen), just(Token::CloseParen)));

            // Types are right associative: Bool -> Bool -> Bool = Bool -> (Bool -> Bool)
            atom.then(just(Token::Arrow).ignore_then(ty.clone()).or_not())
                .map(|(l, r)| match r {
                    Some(r) => Ty::FUNC(Box::new(l), Box::new(r)),
                    None => l,
                })
        });

        let var = select! { Token::Var(v) => NamedTerm::Var(v) };

        let abs = just(Token::Lambda)
            .ignore_then(select! { Token::Var(v) => v })
            .then_ignore(just(Token::Colon))
            .then(ty)
            .then_ignore(just(Token::Dot))
            .then(term.clone())
            .map(|((name, ty), body)| NamedTerm::Abs(name, ty, Box::new(body)));

        // if/then/else branches are full terms, so they extend as far right as possible
        let if_term = just(Token::If)
            .ignore_then(term.clone())
            .then_ignore(just(Token::Then))
            .then(term.clone())
            .then_ignore(just(Token::Else))
            .then(term.clone())
            .map(|((cond, then), els)| NamedTerm::If(
                Box::new(cond),
                Box::new(then),
                Box::new(els),
            ));

        let atom = var
            .or(abs)
            .or(just(Token::True).to(NamedTerm::True))
            .or(just(Token::False).to(NamedTerm::False))
            .or(term.clone().delimited_by(just(Token::OpenParen), just(Token::CloseParen)));

        // Application is left associative
        let app = atom.clone().foldl(
            atom.repeated(),
            |a, b| NamedTerm::App(Box::new(a), Box::new(b)),
        );

        if_term.or(app)
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simply_typed::lexer::lexer;

    fn v(s: &str) -> NamedTerm {
        NamedTerm::Var(s.to_string())
    }

    fn abs(name: &str, ty: Ty, body: NamedTerm) -> NamedTerm {
        NamedTerm::Abs(name.to_string(), ty, Box::new(body))
    }

    fn app(t1: NamedTerm, t2: NamedTerm) -> NamedTerm {
        NamedTerm::App(Box::new(t1), Box::new(t2))
    }

    fn func(t1: Ty, t2: Ty) -> Ty {
        Ty::FUNC(Box::new(t1), Box::new(t2))
    }

    fn parse_named(src: &str) -> NamedTerm {
        let tokens = lexer().parse(src).into_result().unwrap();
        parser().parse(&tokens).into_result().unwrap()
    }

    #[test]
    fn test_parser() {
        // Arrow types are right associative, application is left associative
        assert_eq!(
            parse_named(r"\f:Bool->Bool->Bool. f true false"),
            abs("f",
                func(Ty::BOOLEAN, func(Ty::BOOLEAN, Ty::BOOLEAN)),
                app(app(v("f"), NamedTerm::True), NamedTerm::False)
            )
        );

        // if/then/else branches are full terms
        assert_eq!(
            parse_named(r"if true then false else true true"),
            NamedTerm::If(
                Box::new(NamedTerm::True),
                Box::new(NamedTerm::False),
                Box::new(app(NamedTerm::True, NamedTerm::True)),
            )
        );

        // Parenthesized function types
        assert_eq!(
            parse_named(r"\f:(Bool->Bool)->Bool. f (\x:Bool. x)"),
            abs("f",
                func(func(Ty::BOOLEAN, Ty::BOOLEAN), Ty::BOOLEAN),
                app(v("f"), abs("x", Ty::BOOLEAN, v("x")))
            )
        );
    }
}
