use chumsky::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Value {
    True,
    False,
    Zero
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct If {
    If: Box<Term>,
    Then: Box<Term>,
    Else: Box<Term>
}

#[derive(Clone, Debug, PartialEq, Eq)]
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

fn parse_term<'src>() -> impl Parser<'src, &'src str, Term> {
    recursive(|p| {
        let p_parens = p.padded().delimited_by(just('('), just(')'));

        // Todo the inner terms should be parse_alues or p_parens.clone().padded()
        let if_p = just("if").ignore_then(p_parens.clone().padded())
            .then(just("then").ignore_then(p_parens.clone().padded()))
            .then(just("else").ignore_then(p_parens.clone().padded()))
            .map(
                |((vif, vthen), velse)|
                If {If: Box::new(vif), Then: Box::new(vthen), Else: Box::new(velse)}
            );

        // TL term can have optional round brackets too
        choice((
            if_p.map(|v| v.into()),
            parse_values().map(|v| v.into()),
        )).padded().boxed()
    })
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
    fn test_term() {
        assert!(!parse_term().parse("true").has_errors());

        let parse = parse_term().parse("if (true) then (false) else (zero)").into_result();
        assert_eq!(parse,
            Ok(
                If {
                    If: Box::new(Term::Value(Value::True)),
                    Then: Box::new(Term::Value(Value::False)),
                    Else: Box::new(Term::Value(Value::Zero))
                }.into()
            )
        );
    }
}
