use crate::parsers::untyped_arithmetic::{parse_term, Term};

use chumsky::prelude::*;

pub fn eval(t: Term) -> Term {
    match t {
        Term::Zero => t,
        Term::True => t,
        Term::False => t,
        _ => t
    }
}

mod tests {
    use super::*;

    #[test]
    fn test_values() {
        let t = parse_term().parse("true").into_result().unwrap();
        assert_eq!(t, eval(t.clone()));
        let t = parse_term().parse("false").into_result().unwrap();
        assert_eq!(t, eval(t.clone()));
        let t = parse_term().parse("(zero)").into_result().unwrap();
        assert_eq!(t, eval(t.clone()));
    }
}
