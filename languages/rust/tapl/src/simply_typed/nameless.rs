use crate::simply_typed::checker::Term;
use crate::simply_typed::parser::NamedTerm;

pub fn remove_names(expr: &NamedTerm, names: &mut Vec<String>) -> Result<Term, String> {
    match expr {
        NamedTerm::Var(name) => {
            let idx = names.iter().rposition(|n| n == name)
                .ok_or_else(|| format!("Unbound variable: {}", name))?;
            Ok(Term::Var(names.len() - 1 - idx, names.len()))
        },
        NamedTerm::Abs(name, ty, body) => {
            names.push(name.clone());
            let res = Term::Abs(name.clone(), ty.clone(), Box::new(remove_names(body, names)?));
            names.pop();
            Ok(res)
        },
        NamedTerm::App(t1, t2) => Ok(Term::App(
            Box::new(remove_names(t1, names)?),
            Box::new(remove_names(t2, names)?),
        )),
        NamedTerm::True => Ok(Term::True),
        NamedTerm::False => Ok(Term::False),
        NamedTerm::If(c, t, e) => Ok(Term::If(
            Box::new(remove_names(c, names)?),
            Box::new(remove_names(t, names)?),
            Box::new(remove_names(e, names)?),
        )),
    }
}

pub fn add_names(expr: &Term, names: &mut Vec<String>) -> Result<NamedTerm, String> {
    match expr {
        Term::Var(idx, ctx_len) => {
            if *idx >= *ctx_len {
                return Err(format!("Variable {} out of scope (context length {})", idx, ctx_len));
            }
            let name = names
                .get(ctx_len - 1 - idx)
                .ok_or_else(|| format!("No binding for index {} (context length {})", idx, ctx_len))?;
            Ok(NamedTerm::Var(name.clone()))
        },
        Term::Abs(name, ty, body) => {
            names.push(name.clone());
            let res = NamedTerm::Abs(name.clone(), ty.clone(), Box::new(add_names(body, names)?));
            names.pop();
            Ok(res)
        },
        Term::App(t1, t2) => Ok(NamedTerm::App(
            Box::new(add_names(t1, names)?),
            Box::new(add_names(t2, names)?),
        )),
        Term::True => Ok(NamedTerm::True),
        Term::False => Ok(NamedTerm::False),
        Term::If(c, t, e) => Ok(NamedTerm::If(
            Box::new(add_names(c, names)?),
            Box::new(add_names(t, names)?),
            Box::new(add_names(e, names)?),
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chumsky::Parser;
    use crate::simply_typed::checker::Ty;
    use crate::simply_typed::lexer::lexer;
    use crate::simply_typed::parser::parser;

    fn func(t1: Ty, t2: Ty) -> Ty {
        Ty::FUNC(Box::new(t1), Box::new(t2))
    }

    fn parse_named(src: &str) -> NamedTerm {
        let tokens = lexer().parse(src).into_result().unwrap();
        parser().parse(&tokens).into_result().unwrap()
    }

    fn parse_src(src: &str) -> Term {
        remove_names(&parse_named(src), &mut Vec::new()).unwrap()
    }

    #[test]
    fn test_remove_names() {
        assert_eq!(
            parse_src(r"\x:Bool. \y:Bool->Bool. y x"),
            Term::Abs("x".to_string(), Ty::BOOLEAN, Box::new(
                Term::Abs("y".to_string(), func(Ty::BOOLEAN, Ty::BOOLEAN), Box::new(
                    Term::App(
                        Box::new(Term::Var(0, 2)),
                        Box::new(Term::Var(1, 2)),
                    )
                ))
            ))
        );

        // Unbound variables are rejected
        let named = parse_named(r"\x:Bool. y");
        assert!(remove_names(&named, &mut Vec::new()).is_err());
    }

    #[test]
    fn test_add_names_roundtrip() {
        for src in [
            r"\x:Bool. x",
            r"\x:Bool. \y:Bool->Bool. if y x then x else false",
            r"(\x:Bool->Bool. x) (\y:Bool. y)",
            r"if true then false else true",
        ] {
            let named = parse_named(src);
            let nameless = remove_names(&named, &mut Vec::new()).unwrap();
            let renamed = add_names(&nameless, &mut Vec::new()).unwrap();
            assert_eq!(renamed, named, "roundtrip failed for {src}");
        }
    }
}