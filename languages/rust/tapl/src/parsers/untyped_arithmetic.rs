use chumsky::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct If {
    r#if: Box<Term>,
    then: Box<Term>,
    r#else: Box<Term>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Term {
    True,
    False,
    Zero,
    If(If),
    Pred(Box<Term>),
    IsZero(Box<Term>),
    Succ(Box<Term>)
}

fn parse_atom<'src>() -> impl Parser<'src, &'src str, Term> {
    // Make this recusrive
    just("true")
        .to(Term::True)
        .or(just("false").to(Term::False))
        .or(just("zero").to(Term::Zero))
}

fn unary_fn_parse<'src>(
    name: &'src str,
    inner_p: impl Parser<'src, &'src str, Term>,
) -> impl Parser<'src, &'src str, Term> {
    just(name).ignore_then(inner_p)
}

pub fn parse_term<'src>() -> impl Parser<'src, &'src str, Term> {
    recursive(|p| {
        let p_parens = p.clone().delimited_by(just('('), just(')')).padded();
        let p_values = parse_atom().padded().boxed();
        let p_inner = p_parens.or(p_values.clone()).boxed();

        let if_p = just("if")
            .ignore_then(p_inner.clone())
            .then(just("then").ignore_then(p_inner.clone()))
            .then(just("else").ignore_then(p_inner.clone()))
            .padded()
            .map(|((vif, vthen), velse)| {
                Term::If(If {
                    r#if: Box::new(vif),
                    then: Box::new(vthen),
                    r#else: Box::new(velse),
                })
            });

        let term = choice((
            if_p,
            p_values,
            unary_fn_parse("succ", p_inner.clone()).map(|v| Term::Succ(v.into())),
            unary_fn_parse("pred", p_inner.clone()).map(|v| Term::Pred(v.into())),
            unary_fn_parse("iszero", p_inner).map(|v| Term::IsZero(v.into())),
        ))
        .boxed();
        choice((term.clone(), p.delimited_by(just('('), just(')')).padded())).boxed()
    })
}

mod tests {
    use super::*;

    #[test]
    fn test_term() {
        let valid_terms = [
            "true",
            "true   ",
            "if true then false else zero",
            "if true then   false else zero",
            "if (if true then false else zero) then false else zero",
            "if (   if true then false else zero) then false else zero",
            "(if (if true then false else zero) then false else zero)",
            "  (if (   if true then false else zero) then false else zero)",
            "(true)",
            "((true))",
            "if (true) then (false) else (zero)",
            "succ( if (   if true then false else zero) then false else zero)",
            "succ true",
            "succ (succ zero)",
        ];

        for term_str in valid_terms {
            assert!(!parse_term().parse(term_str).has_errors());
        }

        // Require brackets around any non value inner expression for clarity
        assert!(
            parse_term()
                .parse("if if true then false else zero then false else zero")
                .has_errors()
        );

        let parse = parse_term()
            .parse("if (true) then (false) else (zero)")
            .into_result();
        assert_eq!(
            parse,
            Ok(Term::If(If {
                r#if: Term::True.into(),
                then: Term::False.into(),
                r#else: Term::Zero.into()
            }))
        );

        let parse = parse_term()
            .parse("if true then (succ zero) else zero")
            .into_result();
        assert_eq!(
            parse,
            Ok(Term::If(If {
                r#if: Term::True.into(),
                then: Term::Succ(Term::Zero.into()).into(),
                r#else: Term::Zero.into()
            }))
        );

        let parse = parse_term()
            .parse("succ (succ zero)")
            .into_result();
        assert_eq!(
            parse,
            Ok(
                Term::Succ (
                    Term::Succ (
                        Term::Zero.into()
                    ).into()
                )
            )
        );
    }
}
