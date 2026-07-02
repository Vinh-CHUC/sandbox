#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Value {
    True,
    False,
    Zero,
    Succ(Box<Value>)
}

pub use super::super::parsers::untyped_arithmetic::Expr;

#[derive(Debug, PartialEq, Eq)]
pub enum EvalError {
    TypeError,
    InternalError
}

// This is big-step semantics
pub fn eval(expr: Expr) -> Result<Value, EvalError> {
    match expr {
        // B-Value
        Expr::True => Ok(Value::True),
        Expr::False => Ok(Value::False),
        Expr::Zero => Ok(Value::Zero),

        Expr::If { r#if, r#then, r#else } => match eval(*r#if)? {
            // B-IfTrue
            Value::True => eval(*r#then),
            // B-IfFalse
            Value::False => eval(*r#else),
            _ => Err(EvalError::TypeError),
        },

        Expr::IsZero(inner) => match eval(*inner)? {
            // B-IsZeroZero
            Value::Zero => Ok(Value::True),
            // B-IsZeroSucc
            Value::Succ(_) => Ok(Value::False),
            _ => Err(EvalError::TypeError),
        },

        Expr::Pred(inner) => match eval(*inner)? {
            // B-PredZero
            Value::Zero => Ok(Value::Zero),
            // B-PredSucc
            Value::Succ(v) => Ok(*v),
            _ => Err(EvalError::TypeError),
        },

        // B-Succ
        Expr::Succ(inner) => match eval(*inner)? {
            v @ (Value::Zero | Value::Succ(_)) => Ok(Value::Succ(Box::new(v))),
            _ => Err(EvalError::TypeError),
        },
    }
}

fn is_numeric_value(expr: &Expr) -> bool {
    match expr {
        Expr::Zero => true,
        Expr::Succ(inner) => is_numeric_value(inner),
        _ => false,
    }
}

pub fn eval1(expr: Expr) -> Option<Expr> {
    match expr {
        // E-IfTrue, E-IfFalse, E-If
        Expr::If { r#if, r#then, r#else } => match *r#if {
            Expr::True => Some(*r#then),
            Expr::False => Some(*r#else),
            // VERY Interesting point
            // If there are many nested ifs, there will be **multiple** evaluations of eval1()
            // But  still only one redex
            r#if => {
                let r#if = eval1(r#if)?;
                Some(Expr::If { r#if: Box::new(r#if), r#then, r#else })
            }
        }
        // E-Succ
        Expr::Succ(inner) => {
            let inner = eval1(*inner)?;
            Some(Expr::Succ(Box::new(inner)))
        }
        // E-PredZero, E-PredSucc, E-Pred
        Expr::Pred(inner) => match *inner {
            Expr::Zero => Some(Expr::Zero),
            Expr::Succ(nv) if is_numeric_value(&nv) => Some(*nv),
            inner => {
                let inner = eval1(inner)?;
                Some(Expr::Pred(Box::new(inner)))
            }
        }
        // E-IsZeroZero, E-IsZeroSucc, E-IsZero
        Expr::IsZero(inner) => match *inner {
            Expr::Zero => Some(Expr::True),
            Expr::Succ(nv) if is_numeric_value(&nv) => Some(Expr::False),
            inner => {
                let inner = eval1(inner)?;
                Some(Expr::IsZero(Box::new(inner)))
            }
        }
        _ => None,
    }
}

pub fn eval_small_step(mut expr: Expr) -> Result<Value, EvalError> {
    while let Some(next) = eval1(expr.clone()) {
        expr = next;
    }

    // After we can't step anymore, we should have a value
    match expr {
        Expr::True => Ok(Value::True),
        Expr::False => Ok(Value::False),
        Expr::Zero => Ok(Value::Zero),
        Expr::Succ(inner) if is_numeric_value(&inner) => {
            fn to_value(expr: Expr) -> Value {
                match expr {
                    Expr::Zero => Value::Zero,
                    Expr::Succ(inner) => Value::Succ(Box::new(to_value(*inner))),
                    _ => unreachable!(),
                }
            }
            Ok(Value::Succ(Box::new(to_value(*inner))))
        }
        _ => Err(EvalError::TypeError),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexers::untyped_arithmetic::lexer;
    use chumsky::prelude::*;
    use crate::parsers::untyped_arithmetic::parser;

    fn eval_str_single_step(src: &str) -> Result<Option<Expr>, EvalError>  {
        let tokens = lexer().parse(src).into_result().map_err(|_| EvalError::InternalError)?;
        let ast = parser().parse(&tokens).into_result().map_err(|_| EvalError::InternalError)?;
        Ok(eval1(ast))
    }

    fn eval_str(src: &str) -> Result<Value, EvalError> {
        let tokens = lexer().parse(src).into_result().map_err(|_| EvalError::InternalError)?;
        let ast = parser().parse(&tokens).into_result().map_err(|_| EvalError::InternalError)?;
        let res_big = eval(ast.clone());
        let res_small = eval_small_step(ast);
        assert_eq!(res_big, res_small);
        res_big
    }

    #[test]
    fn test_single_step() {
        let expr = eval_str_single_step("if true then true else 0").unwrap().unwrap();
        // Can't go any further
        assert!(eval1(expr).is_none());
    }

    #[test]
    fn test_single_step_2() {
        eval_str_single_step("
            if
                if
                    if
                        true
                    then
                        true
                    else 0
                then
                    true
                else 0
            then
                true
            else 0
        ").unwrap().unwrap();
        // Above that single call to eval1() actually recursed a few times to reduce the nested
        // if (the one that can be actually evaluated)
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
        // Interestingly we do not need round brackets in this example?
        // As everything is "prefixed" ie self-bracketed in a way
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

#[cfg(test)]
mod arithmetic_tests {
    use super::*;
    use chumsky::prelude::*;
    use crate::lexers::untyped_arithmetic::lexer;
    use crate::parsers::untyped_arithmetic::parser;

    fn eval_str(src: &str) -> Result<Value, EvalError> {
        let tokens = lexer().parse(src).into_result().map_err(|_| EvalError::InternalError)?;
        let ast = parser().parse(&tokens).into_result().map_err(|_| EvalError::InternalError)?;
        let res_big = eval(ast.clone());
        let res_small = eval_small_step(ast);
        assert_eq!(res_big, res_small);
        res_big
    }

    fn build_number(i: i32) -> String {
        if i < 0 { panic!("Expected a positive number") }
        (0..i).into_iter().fold(
            "0".to_owned(),
            |acc, _| "succ ".to_owned() + &acc
        )
    }

    fn substract(i: i32, s: &str) -> String {
        (0..i).into_iter().fold(
            s.to_owned(),
            |acc, _| "pred ".to_owned() + &acc
        )
    }

    fn eval_number(val: &Value) -> Result<i32, EvalError> {
        let mut r = 0;
        let mut mval : &Value = val;
        // loop (as there's no break) guaranteed to never finish (hence we never move past it)
        // so it's "type" is the return type of something inside
        loop {
            match mval {
                Value::Succ(inner_v) => {
                    r += 1;
                    mval = inner_v ;
                },
                Value::Zero => return Ok(r),
                _ => return Err(EvalError::TypeError)
            }
        }
    }

    #[test]
    fn test_number() {
        let number_str = substract(5, &build_number(10));
        let value = eval_str(&number_str).unwrap();
        assert_eq!(eval_number(&value).unwrap(), 5);
    }

    #[test]
    fn test_no_negative_number() {
        let number_str = substract(11, &build_number(10));
        let value = eval_str(&number_str).unwrap();
        assert_eq!(eval_number(&value).unwrap(), 0);
    }
}
