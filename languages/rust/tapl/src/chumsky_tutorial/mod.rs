use chumsky::prelude::*;

#[derive(Debug)]
pub enum Expr<'src> {
    Num(f64),
    Var(&'src str),

    Neg(Box<Expr<'src>>),
    Add(Box<Expr<'src>>, Box<Expr<'src>>),
    Sub(Box<Expr<'src>>, Box<Expr<'src>>),
    Mul(Box<Expr<'src>>, Box<Expr<'src>>),
    Div(Box<Expr<'src>>, Box<Expr<'src>>),

    Call(&'src str, Vec<Expr<'src>>),
    Let {
        name: &'src str,
        rhs: Box<Expr<'src>>,
        then: Box<Expr<'src>>,
    },
    Fn {
        name: &'src str,
        args: Vec<&'src str>,
        body: Box<Expr<'src>>,
        then: Box<Expr<'src>>,
    }
}

fn parser<'src>() -> impl Parser<'src, &'src str, Expr<'src>> {
    let ident = text::ascii::ident().padded();

    let expr = recursive(|expr| {
        let int = text::int(10)
            // unwrap() is kind of save as we know this will parse integers
            .map(|s: &str| Expr::Num(s.parse().unwrap()))
            .padded();

        let atom = int
            .or(expr.delimited_by(just('('), just(')'))).padded()
            .or(ident.map(Expr::Var))
            .padded();

        let op = |c| just(c).padded();

        // foldr note the **right** so it's literally something of the form -----atom
        //
        // (['-',   '-',   '-'],   Num(42.0))
        //   ---    ---    ---     ---------
        //    |      |      |           |
        //    |      |       \         /
        //    |      |      Neg(Num(42.0))
        //    |      |            |
        //    |       \          /
        //    |    Neg(Neg(Num(42.0)))
        //    |            |
        //     \          /
        // Neg(Neg(Neg(Num(42.0))))
        let unary = op('-')
            .repeated()
            .foldr(atom, |_op, rhs| Expr::Neg(Box::new(rhs)));

        let product = unary.clone().foldl(
            choice((
                op('*').to(Expr::Mul as fn(_, _) -> _),
                op('/').to(Expr::Div as fn(_, _) -> _),
            ))
            .then(unary)
            .repeated(),
            |lhs, (op, rhs)| op(Box::new(lhs), Box::new(rhs)),
        );

        let sum = product.clone().foldl(
            choice((
                op('+').to(Expr::Add as fn(_, _) -> _),
                op('-').to(Expr::Sub as fn(_, _) -> _),
            ))
            .then(product)
            .repeated(),
            |lhs, (op, rhs)| op(Box::new(lhs), Box::new(rhs)),
        );

        sum
    });

    let decl = recursive(|decl| {
        let r#let = text::ascii::keyword("let")
            .ignore_then(ident)
            .then_ignore(just('='))
            .then(expr.clone())
            .then_ignore(just(';'))
            .then(decl)
            .map(|((name, rhs), then) | Expr::Let {
                name,
                rhs: Box::new(rhs),
                then: Box::new(then),
            });

        r#let
            .or(expr)
            .padded()
    });

    decl
}

fn eval<'src>(expr: &'src Expr<'src>, vars: &mut Vec<(&'src str, f64)>) -> Result<f64, String> {
    match expr {
        Expr::Num(x) => Ok(*x),
        Expr::Neg(a) => Ok(-eval(a, vars)?),
        Expr::Add(a, b) => Ok(eval(a, vars)? + eval(b, vars)?),
        Expr::Sub(a, b) => Ok(eval(a, vars)? - eval(b, vars)?),
        Expr::Mul(a, b) => Ok(eval(a, vars)? * eval(b, vars)?),
        Expr::Div(a, b) => Ok(eval(a, vars)? / eval(b, vars)?),
        Expr::Var(name) => {
            if let Some((_, val)) = vars.iter().rev().find(|(var, _)| var == name){
                Ok(*val)
            } else {
                Err(format!("Cannot find variable `{}` in scope", name))
            }
        }
        _ => todo!(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parser_arithmetic_expressions(){
        assert!(!parser().parse("(2+3)*3+4*(---5)").has_errors());
    }

    #[test]
    fn test_parser_let_expressions(){
        let s = r#"
            let yo = 5 + 3;
            let a = 5 + a;
            a
        "#;
        assert!(!parser().parse(s).has_errors());
    }

    #[test]
    fn test_parser_let_expressions_need_a_tail_value(){
        let s = r#"
            let yo = 5 + 3;
        "#;
        assert!(parser().parse(s).has_errors());
    }

    #[test]
    fn test_eval(){
        let s = r#"
            let yo = 5 + 3;
            let a = 5 + a;
            a
        "#;
        let mut vars = vec![];
        let ast = parser().parse(s).into_result().unwrap();
        assert_eq!(eval(&ast, &mut vars).unwrap(), 13.0);
    }
}

pub fn tutorial_main() {
    let src = std::fs::read_to_string(std::env::args().nth(1).unwrap()).unwrap();

    let mut variables = vec![];

    match parser().parse(&src).into_result() {
        Ok(ast) => {
            println!("{:?}", ast);
            match eval(&ast, &mut variables){
                Ok(output) => println!("{}", output),
                Err(eval_err) => println!("Evaluation error {}", eval_err),
            }
        }
        Err(parse_errs) => parse_errs.into_iter().for_each(|e| println!("Parse error: {}", e)),
    }
}
