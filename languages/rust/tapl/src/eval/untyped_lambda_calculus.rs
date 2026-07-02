use chumsky::prelude::*;

pub use super::super::parsers::untyped_lambda_calculus::{Expr, free_vars};

#[derive(Debug, Clone, PartialEq, Eq)]
struct Value {
    var: String,
    term: Expr
}

fn substitute(from: &str, to: &Expr, e: &mut Expr) {
    match e {
        Expr::Var(s) if s == from => {
            *e = to.clone();
        },
        Expr::Var(_) => {},
        Expr::Abs(s, t) if s != from && !free_vars(to).contains(s.as_str()) => {
            substitute(from, to, t);
        },
        Expr::Abs(_, _) => {},
        Expr::App(t1, t2) => {
            substitute(from, to, t1);
            substitute(from, to, t2);
        }
    }
}

fn eval(expr: &Expr) -> Result<Expr, String> {
    match expr {
        Expr::Abs(_, _) => Ok(expr.clone()),
        Expr::App(t1, t2) => {
            let v1 = eval(t1)?;
            let v2 = eval(t2)?;

            if let Expr::Abs(s, t) = v1 {
                let mut e = t.clone();
                substitute(s.as_str(), &v2, &mut e); 
                Ok(*e)
            } else {
                Err("Value is not an abstraction".to_string())
            }
        },
        Expr::Var(x) => {
            Err(format!("Unbound variable: {}", x))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_lambda_calculus::lexer;
    use crate::parsers::untyped_lambda_calculus::parser;

    fn v(s: &str) -> Expr {
        Expr::Var(s.to_string())
    }

    fn abs(s: &str, e: Expr) -> Expr {
        Expr::Abs(s.to_string(), Box::new(e))
    }

    fn app(e1: Expr, e2: Expr)-> Expr {
        Expr::App(Box::new(e1), Box::new(e2))
    }

    fn parse_src(src: &str) -> Expr {
        let tokens = lexer().parse(src).into_result().unwrap();
        parser().parse(&tokens).into_result().unwrap()
    }

    #[test]
    fn test_substitute() {
        // noop: no match
        let mut e = parse_src(r"\x. x");
        let before = e.clone();
        substitute("z", &v("y"), &mut e);
        assert_eq!(e, before);

        // noop: can't substitute bound variable
        let mut e = parse_src(r"\x. x");
        let before = e.clone();
        substitute("x", &v("y"), &mut e);
        assert_eq!(e, before);

        // noop: can't bind free vars in the terms that is substituted in
        let mut e = parse_src(r"\y. x");
        let before = e.clone();
        substitute("x", &v("y"), &mut e);
        assert_eq!(e, before);

        // Simple substitution
        let mut e = parse_src(r"\x. y");
        substitute("y", &v("a"), &mut e);
        assert_eq!(e, parse_src(r"\x. a"));

        // Nested substitution
        let mut e = parse_src(r"\x. \y. z");
        substitute("z", &v("a"), &mut e);
        assert_eq!(e, parse_src(r"\x. \y. a"));
    }
}
