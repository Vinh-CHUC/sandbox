use chumsky::prelude::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Value {
    True,
    False,
    Zero,
    Succ(Box<Value>)
}

use super::super::parsers::untyped_arithmetic::Expr;

pub enum EvalError {
    TypeError,
    InternalError
}

pub fn eval(expr: Expr) -> Result<Value, EvalError> {
    match expr {
        Expr::True => Ok(Value::True),
        Expr::False => Ok(Value::False),
        Expr::Zero => Ok(Value::Zero),

        Expr::If{r#if, r#then, r#else} => {
            match eval(*r#if) {
                Ok(Value::True) => eval(*r#then),
                Ok(Value::False) => eval(*r#else),
                err @ Err(_) => err,
                _ => Err(EvalError::TypeError)
            }
        },
        Expr::IsZero(inner) => {
            match eval(*inner) {
                Ok(Value::Zero) => Ok(Value::True),
                Ok(Value::Succ(_)) => Ok(Value::False),
                err @ Err(_) => err,
                _ => Err(EvalError::TypeError)
            }
        },
        Expr::Pred(inner) => {
            match eval(*inner) {
                Ok(Value::Succ(inner_2)) => Ok(*inner_2),
                Ok(Value::Zero) => Ok(Value::Zero),
                err @ Err(_) => err,
                _ => Err(EvalError::TypeError)
            }
        },
        Expr::Succ(inner) => {
            match eval(*inner) {
                Ok(v @ Value::Succ(_)) => Ok(Value::Succ(Box::new(v))),
                Ok(Value::Zero) => Ok(Value::Succ(Box::new(Value::Zero))),
                err @ Err(_) => err,
                _ => Err(EvalError::TypeError)
            }
        }
    }
}
