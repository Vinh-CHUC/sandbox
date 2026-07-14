pub use crate::parsers::untyped_lambda_calculus::nameless::Expr;

pub fn shift(d: i32, cutoff: i32, expr: &mut Expr) {
    match expr {
        Expr::Abs(inner) => shift(d, cutoff + 1, inner),
        Expr::App(t1, t2) => {
            shift(d, cutoff, t1);
            shift(d, cutoff, t2);
        },
        Expr::Var(i) if *i >= cutoff => {
            *i = *i + d;
        }
        Expr::Var(_) => {}
    }
}

pub fn substitute(j: i32, mut s: Expr, expr: &mut Expr) {
    match expr {
        Expr::Abs(inner) => {
            shift(1, 0, &mut s);
            substitute(j + 1, s, inner)
        }
        Expr::App(t1, t2) => {
            substitute(j, s.clone(), t1);
            substitute(j, s, t2);
        }
        Expr::Var(i) if j == *i => { *expr = s.clone() },
        Expr::Var(_) => {()},
    }
}

pub fn eval(expr: &Expr) -> Result<Expr, String> {
    match expr {
        Expr::Abs(_) => {Ok(expr.clone())},
        Expr::App(t1, t2) => {
            let v1 = eval(&t1)?;
            let mut v2 = eval(&t2)?;

            if let Expr::Abs(mut inner) = v1 {
                // v2 is being substited inside an abstraction, so we have to shift its free
                // variable
                shift(1, 0, &mut v2);
                substitute(0, v2, &mut inner);
                // We lose an abstraction we have to drop free vars by 1
                shift(-1, 0, &mut inner);
                Ok(*inner)
            } else {
                Err("Value is not an abstraction".to_string())
            }
        },
        Expr::Var(i) => {
            Err(format!("Unbound variable: {}", i))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_lambda_calculus::nameless::lexer;
    use crate::parsers::untyped_lambda_calculus::nameless::parser;
    use chumsky::Parser;

    fn v(u: i32) -> Expr {
        Expr::Var(u)
    }

    fn abs(e: Expr) -> Expr {
        Expr::Abs(Box::new(e))
    }

    fn parse_src(src: &str) -> Expr {
        let tokens = lexer().parse(src).into_result().unwrap();
        parser().parse(&tokens).into_result().unwrap()
    }

    #[test]
    fn test_shift() {
        let mut e = parse_src(r"\. 0");
        let before = e.clone();
        shift(1, 0, &mut e);
        assert_eq!(e, before);

        let mut e = parse_src(r"0");
        shift(1, 0, &mut e);
        assert_eq!(e, v(1));

        let mut e = parse_src(r"\. 1");
        shift(1, 0, &mut e);
        assert_eq!(e, abs(v(2)));
    }

    #[test]
    fn test_substitute() {
        let mut e = parse_src(r"\. 0");
        let before = e.clone();
        substitute(0, v(42), &mut e);
        assert_eq!(e, before);

        let mut e = parse_src(r"0");
        substitute(0, v(42), &mut e);
        assert_eq!(e, v(42));

        let mut e = parse_src(r"\. 1");
        substitute(0, v(42), &mut e);
        assert_eq!(e, abs(v(43)));

        // A bit more involved, we substitute 0 for \. 2
        // But end up actually substituting 1 (as we traverse an abstraction)
        // We also have to "bump up" the free var 2 to 3
        let mut e = parse_src(r"\. 1");
        substitute(0, abs(v(2)), &mut e);
        assert_eq!(e, parse_src(r"\. \. 3"));
    }

    #[test]
    fn test_eval() {
        let e = parse_src(r"(\. 0) (\. 0)");
        assert_eq!(eval(&e), Ok(parse_src(r"\. 0")));

        let e = parse_src(r"(\. \. 1) (\. 3)");
        // The free var 3 gets incremented twice during substitution
        // But then gets dropped once as we lose the abstraction when we evaluate
        assert_eq!(eval(&e), Ok(parse_src(r"\. \. 4")));
    }
}
