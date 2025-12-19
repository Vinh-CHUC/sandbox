use crate::parsers::untyped_arithmetic::{Term};

// We have to have a way to signal that the evaluation "did not do anything"
// The caller (eval) can then detect that and just return the argument if this return None
pub fn eval_step(t: Term) -> Option<Term> {
    match t {
        Term::Zero => None,
        Term::True => None,
        Term::False => None,
        Term::Pred(b) => {
            // We have this inner match because "box patterns" isn't a thing yet as of when I write
            // these lines
            let inner = *b;
            match inner {
                Term::Zero => Some(Term::Zero),
                Term::Succ(inner2) => Some(*inner2),
                term  => {
                    eval_step(term.clone()).map_or(
                        None,
                        |t| Some(Term::Pred (Box::new(t)))
                    )
                }
            }
        }
        Term::Succ(b) => {
            let term = *b;
            eval_step(term.clone()).map_or(
                None,
                |t| Some(Term::Succ (Box::new(t)))
            )
        }
        Term::IsZero(b) => {
            let inner = *b;
            match inner {
                Term::Zero => Some(Term::True),
                Term::Succ(_) => Some(Term::False),
                term  => {
                    eval_step(term.clone()).map_or(
                        None,
                        |t| Some(Term::IsZero (Box::new(t)))
                    )
                }
            }
        }
        _ => None
    }
}

pub fn eval(t: Term) -> Term {
    eval_step(t.clone()).map_or(t, eval)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chumsky::prelude::*;
    use crate::parsers::untyped_arithmetic::{parse_term};

    fn parse_unwrap<T: AsRef<str>>(s: T) -> Term {
        parse_term().parse(s.as_ref()).into_result().unwrap()
    }

    #[test]
    fn test_values() {
        let t = parse_unwrap("true");
        assert_eq!(eval_step(t.clone()), None);

        let t = parse_unwrap("false");
        assert_eq!(eval_step(t.clone()), None);

        let t = parse_unwrap("zero");
        assert_eq!(eval_step(t.clone()), None);
    }

    #[test]
    fn test_predsucc() {
        let t = parse_unwrap("pred (succ zero)");
        assert_eq!(eval_step(t).unwrap(), parse_unwrap("zero"));
    }

    #[test]
    fn test_predzero() {
        let t = parse_unwrap("pred zero");
        assert_eq!(eval_step(t).unwrap(), parse_unwrap("zero"));
    }

    #[test]
    fn test_pred() {
        let t = parse_unwrap("pred (pred (succ zero))");
        assert_eq!(eval_step(t.clone()).unwrap(), parse_unwrap("pred zero"));
        assert_eq!(eval(t), parse_unwrap("zero"));
    }
}
