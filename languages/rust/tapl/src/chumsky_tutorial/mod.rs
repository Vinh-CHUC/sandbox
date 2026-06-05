use chumsky::prelude::*;

#[derive(Debug)]
enum Expr<'src> {
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
    let int = text::int(10)
        .map(|s: &str| Expr::Num(s.parse().unwrap()))
        .padded();

    let atom = int;

    let op = |c| just(c).padded();

    // foldr note the **right** so it's literally something of the form -----atom
    let unary = op('-')
        .repeated()
        .foldr(atom, |_op, rhs| Expr::Neg(Box::new(rhs)));

    unary
}


pub fn tutorial_main() {
    let src = std::fs::read_to_string(std::env::args().nth(1).unwrap()).unwrap();
    println!("{:?}", parser().parse(&src));
}
