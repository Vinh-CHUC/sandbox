use crate::parsers::untyped_arithmetic::{parse_term, Term};

pub fn eval(t: Term) -> Term {
    match t {
        _ => t
    }
}

mod tests {
    use super::*;

    #[test]
    fn test_values() {
    }
}
