use chumsky::prelude::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Value {
    True,
    False,
    Zero,
    Succ(Box<Value>)
}

use super::super::parsers::untyped_arithmetic::Expr;

#[derive(Debug, PartialEq, Eq)]
pub enum EvalError {
    TypeError,
    InternalError
}

pub fn eval(expr: Expr) -> Result<Value, EvalError> {
    match expr {
        Expr::True => Ok(Value::True),
        Expr::False => Ok(Value::False),
        Expr::Zero => Ok(Value::Zero),

        Expr::If { r#if, r#then, r#else } => match eval(*r#if)? {
            Value::True => eval(*r#then),
            Value::False => eval(*r#else),
            _ => Err(EvalError::TypeError),
        },

        Expr::IsZero(inner) => match eval(*inner)? {
            Value::Zero => Ok(Value::True),
            Value::Succ(_) => Ok(Value::False),
            _ => Err(EvalError::TypeError),
        },

        Expr::Pred(inner) => match eval(*inner)? {
            Value::Zero => Ok(Value::Zero),
            Value::Succ(v) => Ok(*v),
            _ => Err(EvalError::TypeError),
        },

        Expr::Succ(inner) => match eval(*inner)? {
            v @ (Value::Zero | Value::Succ(_)) => Ok(Value::Succ(Box::new(v))),
            _ => Err(EvalError::TypeError),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_arithmetic::lexer;
    use crate::parsers::untyped_arithmetic::parser;

    fn eval_str(src: &str) -> Result<Value, EvalError> {
        let tokens = lexer().parse(src).into_result().map_err(|_| EvalError::InternalError)?;
        let ast = parser().parse(&tokens).into_result().map_err(|_| EvalError::InternalError)?;
        eval(ast)
    }

    #[test]
    fn test_eval_basic() {
        assert_eq!(eval_str("true").unwrap(), Value::True);
        assert_eq!(eval_str("0").unwrap(), Value::Zero);
    }

    #[test]
    fn test_eval_arithmetic() {
        assert_eq!(
            eval_str("succ succ 0").unwrap(),
            Value::Succ(Box::new(Value::Succ(Box::new(Value::Zero))))
        );
        assert_eq!(eval_str("pred succ 0").unwrap(), Value::Zero);
        assert_eq!(eval_str("pred 0").unwrap(), Value::Zero);
    }

    #[test]
    fn test_eval_iszero() {
        assert_eq!(eval_str("iszero 0").unwrap(), Value::True);
        assert_eq!(eval_str("iszero succ 0").unwrap(), Value::False);
    }

    #[test]
    fn test_eval_if() {
        assert_eq!(eval_str("if iszero 0 then true else false").unwrap(), Value::True);
        assert_eq!(eval_str("if false then 0 else succ 0").unwrap(), Value::Succ(Box::new(Value::Zero)));

        // Nested if in condition
        assert_eq!(
            eval_str("if if iszero 0 then true else false then succ 0 else 0").unwrap(),
            Value::Succ(Box::new(Value::Zero))
        );

        // Nested if in branches
        let complex_nested = "
            if iszero pred succ 0 then
                if iszero 0 then
                    succ succ 0
                else
                    0
            else
                0
        ";
        assert_eq!(
            eval_str(complex_nested).unwrap(),
            Value::Succ(Box::new(Value::Succ(Box::new(Value::Zero))))
        );
    }

    #[test]
    fn test_eval_errors() {
        assert!(matches!(eval_str("succ true"), Err(EvalError::TypeError)));
        assert!(matches!(eval_str("if 0 then true else false"), Err(EvalError::TypeError)));
    }
}
