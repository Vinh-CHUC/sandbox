pub use crate::parsers::untyped_lambda_calculus::nameless::Expr;
pub use crate::eval::NAMES;
use crate::parsers::untyped_lambda_calculus::Expr as ExprWithName;

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

pub fn remove_names(expr: &ExprWithName, names: &mut Vec<char>) -> Result<Expr, String> {
    match expr {
        ExprWithName::Var(i) => {
            let idx = names.iter().rposition(|c| c.to_string() == *i).unwrap();
            Ok(Expr::Var((names.len() - 1 - idx) as i32))
        },
        ExprWithName::App(t1, t2) => {
            Ok(Expr::App(
                Box::new(remove_names(t1, names)?),
                Box::new(remove_names(t2, names)?),
            ))
        },
        ExprWithName::Abs(name, t) => {
            names.push(name.chars().next().unwrap());
            let res = Expr::Abs(Box::new(remove_names(t, names)?));
            names.pop();
            Ok(res)
        }
    }
}

pub fn add_names(expr: &Expr, name_idx: u8) -> Result<ExprWithName, String> {
    match expr {
        Expr::Var(i) => {
            let c = NAMES[(name_idx as i32 - 1 - *i) as usize];
            Ok(ExprWithName::Var(c.to_string()))
        },
        Expr::App(t1, t2) => {
            Ok(ExprWithName::App(
                Box::new(add_names(t1, name_idx)?),
                Box::new(add_names(t2, name_idx)?),
            ))
        },
        Expr::Abs(t) => {
            let c = NAMES[name_idx as usize];
            let name_idx = name_idx + 1;
            Ok(ExprWithName::Abs(
                c.to_string(),
                Box::new(add_names(&t, name_idx)?)
            ))
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

    #[test]
    fn test_add_names() {
        use crate::lexers::untyped_lambda_calculus::lexer as named_lexer;
        use crate::parsers::untyped_lambda_calculus::parser as named_parser;

        fn parse_named_src(src: &str) -> ExprWithName {
            let tokens = named_lexer().parse(src).into_result().unwrap();
            named_parser().parse(&tokens).into_result().unwrap()
        }

        let e = parse_src(r"\. 0");
        let named = add_names(&e, 0).unwrap();
        // The name will be 'x' (0), and the var will be 'x' (0)
        assert_eq!(named, parse_named_src(r"\x. x"));

        // \. \. 1 0 => \x. \y. x y
        let e2 = parse_src(r"\. \. 1 0");
        let named2 = add_names(&e2, 0).unwrap();
        assert_eq!(named2, parse_named_src(r"\x. \y. x y"));
    }

    #[test]
    fn test_remove_names_roundtrip() {
        // Test that turning a nameless expression to named and back yields the original

        // Roundtrip 1: \. 0 -> \x. x -> \. 0
        let e1 = parse_src(r"\. 0");
        let named1 = add_names(&e1, 0).unwrap();
        let unnamed1 = remove_names(&named1, &mut Vec::new()).unwrap();
        assert_eq!(e1, unnamed1);

        // Roundtrip 2: \. \. 1 0 -> \x. \y. x y -> \. \. 1 0
        let e2 = parse_src(r"\. \. 1 0");
        let named2 = add_names(&e2, 0).unwrap();
        let unnamed2 = remove_names(&named2, &mut Vec::new()).unwrap();
        assert_eq!(e2, unnamed2);

        // Roundtrip 3: \. \. \. 2 1 0 (deeper nesting)
        let e3 = parse_src(r"\. \. \. 2 1 0");
        let named3 = add_names(&e3, 0).unwrap();
        let unnamed3 = remove_names(&named3, &mut Vec::new()).unwrap();
        assert_eq!(e3, unnamed3);

        // Roundtrip 4: application of abstractions
        let e4 = parse_src(r"(\. 0) (\. 0)");
        let named4 = add_names(&e4, 0).unwrap();
        let unnamed4 = remove_names(&named4, &mut Vec::new()).unwrap();
        assert_eq!(e4, unnamed4);
    }
}
