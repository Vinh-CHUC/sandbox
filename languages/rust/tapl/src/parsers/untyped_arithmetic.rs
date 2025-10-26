use chumsky::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Value {
    True,
    False,
    Zero
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct If {
    If: Box<Value>,
    Then: Box<Value>,
    Else: Box<Value>
}

pub enum Term {
   Value(Value), 
   If(If),
}

impl From<Value> for Term {
    fn from(v: Value) -> Self {
        Term::Value(v)
    }
}

impl From<If> for Term {
    fn from(r#if: If) -> Self {
        Term::If(r#if)
    }
}

fn parse_values<'src>() -> impl Parser<'src, &'src str, Value> {
    just("true").to(Value::True)
        .or(just("false").to(Value::False))
        .or(just("zero").to(Value::Zero))
}

pub fn parse_values_pad_strict<'src>() -> impl Parser<'src, &'src str, Value> {
    parse_values().padded_by(text::whitespace().at_least(1))
}

pub fn parse_values_pad<'src>() -> impl Parser<'src, &'src str, Value> {
    parse_values().padded_by(text::whitespace())
}

pub fn parse_if<'src>() -> impl Parser<'src, &'src str, If> {
    just("if").ignore_then(parse_values_pad_strict())
        .then(just("then").ignore_then(parse_values_pad_strict()))
        .then(just("else").ignore_then(parse_values_pad()))
        .map(
            |((vif, vthen), velse)|
            If {If: Box::new(vif), Then: Box::new(vthen), Else: Box::new(velse)}
        )
}

pub fn parse_term<'src>() -> impl Parser<'src, &'src str, Term> {
    let mk_base = || {
        parse_values().map(|v| v.into()).or(parse_if().map(|v| v.into()))
    };

    just("(").ignore_then(mk_base().padded()).then_ignore(just(")")).padded()
        .or(mk_base().padded().then_ignore(end()))
}

mod tests {
    use super::*;

    #[test]
    fn test_values() {
        assert_eq!(parse_values().parse("true").into_result(), Ok(Value::True));
        assert_eq!(parse_values().parse("false").into_result(), Ok(Value::False));
        assert_eq!(parse_values().parse("zero").into_result(), Ok(Value::Zero));
        assert!(parse_values().parse("True").has_errors());
        assert!(parse_values().parse("FAlse").has_errors());
    }

    #[test]
    fn test_if() {
        let parse = parse_if().parse("if true then false else zero").into_result();
        assert_eq!(parse,
            Ok(
                If {
                    If: Box::new(Value::True),
                    Then: Box::new(Value::False),
                    Else: Box::new(Value::Zero)
                }
            )
        );

        assert!(parse_if().parse("if true then false").has_errors());
    }
}
