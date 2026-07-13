pub use crate::parsers::untyped_lambda_calculus::nameless::Expr;

pub fn shift(_d: u32, _cutoff: u32, _expr: &mut Expr) {
    match _expr {
        Expr::Abs(inner) => shift(_d, _cutoff + 1, inner),
        Expr::App(t1, t2) => {
            shift(_d, _cutoff, t1);
            shift(_d, _cutoff, t2);
        },
        Expr::Var(i) if *i >= _cutoff => {
            *i = *i + _d; 
        }
        Expr::Var(_) => {}
    }
}

pub fn substitute(_j: u32, _s: &Expr, _expr: &mut Expr) {
    todo!()
}

pub fn eval(_expr: &Expr) -> Result<Expr, String> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_lambda_calculus::nameless::lexer;
    use crate::parsers::untyped_lambda_calculus::nameless::parser;
    use chumsky::Parser;

    fn v(u: u32) -> Expr {
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

    // #[test]
    // fn test_substitute() {
    //     let mut e = parse_src(r"\. 0");
    //     let before = e.clone();
    //     substitute(0, &v(42), &mut e);
    //     assert_eq!(e, before);

    //     let mut e = parse_src(r"0");
    //     substitute(0, &v(42), &mut e);
    //     assert_eq!(e, v(42));

    //     let mut e = parse_src(r"\. 1");
    //     substitute(0, &v(42), &mut e);
    //     assert_eq!(e, abs(v(43)));
    // }

    // #[test]
    // fn test_eval() {
    //     let e = parse_src(r"(\. 0) (\. 0)");
    //     assert_eq!(eval(&e), Ok(parse_src(r"\. 0")));

    //     let e = parse_src(r"(\. \. 1) (\. 0)");
    //     assert_eq!(eval(&e), Ok(parse_src(r"\. \. 0")));
    // }
}
