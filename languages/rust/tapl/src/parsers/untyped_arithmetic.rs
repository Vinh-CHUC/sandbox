use chumsky::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Value {
    True,
    False,
    Zero,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct If {
    r#if: Box<Term>,
    then: Box<Term>,
    r#else: Box<Term>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Succ(Box<Term>);

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Pred(Box<Term>);

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IsZero(Box<Term>);

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Term {
    Value(Value),
    If(If),
    Succ(Succ),
    Pred(Pred),
    IsZero(IsZero),
}

impl From<Value> for Term {
    fn from(v: Value) -> Self {
        Term::Value(v)
    }
}

impl From<Value> for Box<Term> {
    fn from(v: Value) -> Self {
        Box::new(v.into())
    }
}

impl From<If> for Term {
    fn from(r#if: If) -> Self {
        Term::If(r#if)
    }
}

impl From<If> for Box<Term> {
    fn from(r#if: If) -> Self {
        Box::new(r#if.into())
    }
}

impl From<Succ> for Term {
    fn from(succ: Succ) -> Self {
        Term::Succ(succ)
    }
}

impl From<Succ> for Box<Term> {
    fn from(succ: Succ) -> Self {
        Box::new(succ.into())
    }
}

impl From<Pred> for Term {
    fn from(pred: Pred) -> Self {
        Term::Pred(pred)
    }
}

impl From<Pred> for Box<Term> {
    fn from(pred: Pred) -> Self {
        Box::new(pred.into())
    }
}

impl From<IsZero> for Term {
    fn from(is_zero: IsZero) -> Self {
        Term::IsZero(is_zero)
    }
}

impl From<IsZero> for Box<Term> {
    fn from(is_zero: IsZero) -> Self {
        Box::new(is_zero.into())
    }
}

fn parse_values<'src>() -> impl Parser<'src, &'src str, Value> {
    just("true")
        .to(Value::True)
        .or(just("false").to(Value::False))
        .or(just("zero").to(Value::Zero))
}

fn unary_fn_parse<'src, T: From<Term>>(
    name: &'src str,
    inner_p: impl Parser<'src, &'src str, Term>,
) -> impl Parser<'src, &'src str, T> {
    just(name).ignore_then(inner_p).map(T::from)
}

fn parse_term<'src>() -> impl Parser<'src, &'src str, Term> {
    recursive(|p| {
        let p_parens = p.clone().delimited_by(just('('), just(')')).padded();
        let p_values = parse_values().padded().map(|v| v.into()).boxed();
        let p_inner = p_parens.or(p_values.clone()).boxed();

        let if_p = just("if")
            .ignore_then(p_inner.clone())
            .then(just("then").ignore_then(p_inner.clone()))
            .then(just("else").ignore_then(p_inner.clone()))
            .padded()
            .map(|((vif, vthen), velse)| {
                If {
                    r#if: Box::new(vif),
                    then: Box::new(vthen),
                    r#else: Box::new(velse),
                }
                .into()
            });

        let term = choice((
            if_p,
            p_values,
            unary_fn_parse("succ", p_inner.clone()),
            unary_fn_parse("pred", p_inner.clone()),
            unary_fn_parse("iszero", p_inner),
        ))
        .boxed();
        choice((term.clone(), p.delimited_by(just('('), just(')')).padded())).boxed()
    })
}

mod tests {
    use super::*;

    #[test]
    fn test_values() {
        assert_eq!(parse_values().parse("true").into_result(), Ok(Value::True));
        assert_eq!(
            parse_values().parse("false").into_result(),
            Ok(Value::False)
        );
        assert_eq!(parse_values().parse("zero").into_result(), Ok(Value::Zero));
        assert!(parse_values().parse("True").has_errors());
        assert!(parse_values().parse("FAlse").has_errors());
    }

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
            Ok(If {
                r#if: Value::True.into(),
                then: Value::False.into(),
                r#else: Value::Zero.into()
            }
            .into())
        );
    }
}
