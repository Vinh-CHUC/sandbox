use std::vec;

use chumsky::prelude::*;

#[derive(Debug, PartialEq)]
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
    // Dynamic scoping
    DynFn {
        name: &'src str,
        args: Vec<&'src str>,
        body: Box<Expr<'src>>,
        then: Box<Expr<'src>>,
    },
    // Lexical scoping
    LexFn {
        name: &'src str,
        args: Vec<&'src str>,
        closure: Vec<&'src str>,
        body: Box<Expr<'src>>,
        then: Box<Expr<'src>>,
    },
}

fn parser<'src>() -> impl Parser<'src, &'src str, Expr<'src>> {
    let ident = text::ascii::ident().padded();

    let expr = recursive(|expr| {
        let int = text::int(10)
            // unwrap() is kind of save as we know this will parse integers
            .map(|s: &str| Expr::Num(s.parse().unwrap()))
            .padded();

        let call = ident
            .then(
                expr.clone()
                    .separated_by(just(','))
                    .allow_trailing()
                    .collect::<Vec<_>>()
                    .delimited_by(just('('), just(')')),
            )
            .map(|(f, args)| Expr::Call(f, args));

        let atom = int
            .or(expr.delimited_by(just('('), just(')')))
            .or(call)
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
            .then(decl.clone())
            .map(|((name, rhs), then) | Expr::Let {
                name,
                rhs: Box::new(rhs),
                then: Box::new(then),
            });
        let dynfn = text::ascii::keyword("dynfn")
            .ignore_then(ident)
            .then(ident.repeated().collect::<Vec<_>>())
            .then_ignore(just('='))
            .then(expr.clone())
            .then_ignore(just(';'))
            .then(decl.clone())
            .map(|(((name, args), body), then)| Expr::DynFn {
                name,
                args,
                body: Box::new(body),
                then: Box::new(then),
            });

        let lexfn = text::ascii::keyword("lexfn")
            .ignore_then(ident)
            .then(ident.repeated().collect::<Vec<_>>())
            // Optional closure
            .then(
                ident.repeated().collect::<Vec<_>>().delimited_by(just('[').padded(), just(']').padded()).or_not()
            )
            .then_ignore(just('='))
            .then(expr.clone())
            .then_ignore(just(';'))
            .then(decl)
            .map(|((((name, args), closure), body), then)| Expr::LexFn {
                name,
                args,
                closure:closure.unwrap_or(vec![]),
                body: Box::new(body),
                then: Box::new(then),
            });

        r#let.or(dynfn).or(lexfn).or(expr).padded()
    });

    decl
}

mod helper {
    use super::*;

    #[derive(Clone, Debug, PartialEq)]
    pub enum Function<'src> {
        DynFn {
            name: &'src str,
            args: &'src [&'src str],
            body: &'src Expr<'src>
        },
        LexFn {
            name: &'src str,
            args: &'src [&'src str],
            closure: &'src [&'src str],
            body: &'src Expr<'src>
        }
    }

    pub struct Functions<'src> {
        functions: Vec<Function<'src>>

    }

    impl<'src> Functions<'src> {
        pub fn new() -> Self {
            Functions{functions: vec![]}
        }

        pub fn find(&self, fn_name: &'src str) -> Option<Function<'src>>{
            self.functions.iter().rev().find(|func|
                match func {
                    Function::DynFn { name, args, body } if *name == fn_name => { true },
                    Function::LexFn { name, args, closure, body } if *name == fn_name => {
                        true
                    },
                    _ => { false }
                }
            ).cloned()
        }
    }
}

fn eval<'src>(
    expr: &'src Expr<'src>,
    vars: &mut Vec<(&'src str, f64)>,
    funcs: &mut Vec<(&'src str, &'src [&'src str], &'src Expr<'src>)>,
) -> Result<f64, String> {
    match expr {
        Expr::Num(x) => Ok(*x),
        Expr::Neg(a) => Ok(-eval(a, vars, funcs)?),
        Expr::Add(a, b) => Ok(eval(a, vars, funcs)? + eval(b, vars, funcs)?),
        Expr::Sub(a, b) => Ok(eval(a, vars, funcs)? - eval(b, vars, funcs)?),
        Expr::Mul(a, b) => Ok(eval(a, vars, funcs)? * eval(b, vars, funcs)?),
        Expr::Div(a, b) => Ok(eval(a, vars, funcs)? / eval(b, vars, funcs)?),
        Expr::Var(name) => {
            // Searching variables backwards, e.g. shadowing
            if let Some((_, val)) = vars.iter().rev().find(|(var, _)| var == name){
                Ok(*val)
            } else {
                Err(format!("Cannot find variable `{}` in scope", name))
            }
        },
        Expr::Let {name, rhs, then } => {
            let rhs = eval(rhs, vars, funcs);
            vars.push((name, rhs?));
            let output = eval(then, vars, funcs);

            // Strictly speaking not necessary when I write these lines as there's no nested
            // let expressions? Explanations:
            // - Basically when pop()-ing there's no further evaluation
            // - Because rhs is evaluated before then
            // - There is only one scope
            //
            // If there were nested let expressions:
            //let a =
            //  let b = 1;
            //  b;
            // a
            vars.pop();
            output
        },
        Expr::Call(name, args) => {
            if let Some((_, arg_names, body)) =
                funcs.iter().rev().find(|(var, _, _)| var == name).copied()
            {
                if arg_names.len() == args.len() {
                    let mut evaled_args = args
                        .iter()
                        .map(|arg| eval(arg, vars, funcs))
                        .zip(arg_names.iter())
                        .map(|(val, name)| Ok((*name, val?)))
                        .collect::<Result<_, String>>()?;
                    let old_vars = vars.len();
                    vars.append(&mut evaled_args);
                    let output = eval(body, vars, funcs);
                    vars.truncate(old_vars);
                    output
                } else {
                    Err(format!(
                        "Wrong number of arguments for function `{}`: expected {}, found {}",
                        name,
                        arg_names.len(),
                        args.len(),
                    ))
                }
            } else {
                Err(format!("Cannot find function `{}` in scope", name))
            }
        },
        Expr::DynFn {name, args, body, then} => {
            funcs.push((name, args, body));
            let output = eval(then, vars, funcs);
            funcs.pop();
            output
        },
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
            let a = 5 + yo;
            a
        "#;
        let mut vars = vec![];
        let mut funcs = vec![];
        let ast = parser().parse(s).into_result().unwrap();
        assert_eq!(eval(&ast, &mut vars, &mut funcs).unwrap(), 13.0);
    }

    #[test]
    fn test_eval_2(){
        let s = r#"
            let x = 5;
            let x = 3 + x;
            x
        "#;
        let mut vars = vec![];
        let mut funcs = vec![];
        let ast = parser().parse(s).into_result().unwrap();
        assert_eq!(eval(&ast, &mut vars, &mut funcs).unwrap(), 8.0);
    }

    #[test]
    fn test_eval_fns(){
        let s = r#"
            dynfn linear x y = 5 * x + y;
            linear(2, 3)
        "#;
        let mut vars = vec![];
        let mut funcs = vec![];
        let ast = parser().parse(s).into_result().unwrap();
        assert_eq!(eval(&ast, &mut vars, &mut funcs).unwrap(), 13.0);
    }

    #[test]
    fn test_fns_dynamic_scoping(){
        // Technically a bug!!
        // As usually one would expect lexical scoping
        let s = r#"
            let y = 5;
            dynfn linear x = 5 * x + y;
            let y = 6;
            linear(2)
        "#;
        let mut vars = vec![];
        let mut funcs = vec![];
        let ast = parser().parse(s).into_result().unwrap();
        assert_eq!(eval(&ast, &mut vars, &mut funcs).unwrap(), 16.0);
    }

    #[test]
    fn test_fns_lexical_scoping(){
        let s = r#"
            let y = 5;
            lexfn linear x [y] = 5 * x + y;
            lexfn linear x = 5 * x + y;
            linear(5)
        "#;
        parser().parse(s).into_result().unwrap();
    }
}

pub fn tutorial_main() {
    let src = std::fs::read_to_string(std::env::args().nth(1).unwrap()).unwrap();

    let mut variables = vec![];
    let mut funcs = vec![];

    match parser().parse(&src).into_result() {
        Ok(ast) => {
            println!("{:?}", ast);
            match eval(&ast, &mut variables, &mut funcs){
                Ok(output) => println!("{}", output),
                Err(eval_err) => println!("Evaluation error {}", eval_err),
            }
        }
        Err(parse_errs) => parse_errs.into_iter().for_each(|e| println!("Parse error: {}", e)),
    }
}
