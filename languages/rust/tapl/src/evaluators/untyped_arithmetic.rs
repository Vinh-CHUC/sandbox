use crate::parsers::untyped_arithmetic::{parse_term, Term};

use chumsky::prelude::*;

pub fn eval(t: Term) -> Term {
    match t {
        Term::Zero => t,
        Term::True => t,
        Term::False => t,
        Term::Pred(b) => {
            let inner = *b;
            match inner {
                Term::Zero => Term::Zero,
                Term::Succ(inner2) => *inner2,
                term  => Term::Pred (Box::new(eval(term)))
            }
        }
        _ => t
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_unwrap<T: AsRef<str>>(s: T) -> Term {
        parse_term().parse(s.as_ref()).into_result().unwrap()
    }

    #[test]
    fn test_values() {
        let t = parse_unwrap("true");
        assert_eq!(eval(t.clone()), eval(t));

        let t = parse_unwrap("false");
        assert_eq!(eval(t.clone()), eval(t));

        let t = parse_unwrap("zero");
        assert_eq!(eval(t.clone()), eval(t));
    }

    #[test]
    fn test_predsucc() {
        let t = parse_unwrap("pred (succ zero)");
        assert_eq!(eval(t), parse_unwrap("zero"));
    }
}
