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
    recursive(|expr| {
        let int = text::int(10)
            // unwrap() is kind of save as we know this will parse integers
            .map(|s: &str| Expr::Num(s.parse().unwrap()))
            .padded();

        let atom = int.or(expr.delimited_by(just('('), just(')'))).padded();

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
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parser(){
        assert!(!parser().parse("(2+3)*3+4*(---5)").has_errors());
    }
}


pub fn tutorial_main() {
    let src = std::fs::read_to_string(std::env::args().nth(1).unwrap()).unwrap();
    println!("{:?}", parser().parse(&src));
}
