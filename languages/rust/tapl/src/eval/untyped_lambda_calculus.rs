use chumsky::prelude::*;

pub use super::super::parsers::untyped_lambda_calculus::Expr;

#[derive(Debug, Clone, PartialEq, Eq)]
struct Value {
    var: String,
    term: Expr
}

pub fn eval(expr: Expr) -> Result<Value, String> {
    match expr {
        Expr::Abs(x, body) => Ok(Value{var:x, term:*body}),
        Expr::App(t1, t2) => {
            let v1 = eval(*t1)?;
            let v2 = eval(*t2)?;
            todo!();
        },
        Expr::Var(x) => {
            Err(format!("Unbound variable: {}", x))
        }
    }
}
