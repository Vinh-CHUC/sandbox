#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Ty {
    BOOLEAN,
    FUNC(Box<Ty>, Box<Ty>)
}

#[derive(Clone, Debug, PartialEq)]
pub enum Binding {
    Name,
    TypedVar(Ty)
}

#[derive(Clone, Debug, PartialEq)]
pub struct Context(Vec<(String, Binding)>);

impl Context {
    pub fn add_binding_mut(&mut self, name: String, b: Binding) {
        self.0.push((name, b))
    }

    pub fn add_binding_clone(&self, name: String, b: Binding) -> Context {
        let mut c = self.0.clone();
        c.push((name, b));
        Context(c)
    }

    pub fn add_binding(mut self, name: String, b: Binding) -> Context {
        self.0.push((name, b));
        self
    }

    pub fn getType(&self, idx: usize) -> Result<Ty, String> {
        let b = self.0.get(idx).map(|x| &(x.1)).ok_or_else(|| "Index not found".to_owned())?;
        match b {
            Binding::Name => Err("No type information".to_owned()),
            Binding::TypedVar(ty) => Ok(ty.clone())
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Term {
    Var(usize, usize),  // De Bruijn idx, context length ~ number of lambda binders from root to <here>
    Abs(String, Ty, Box<Term>),  // String: param name, Ty: Type of the argument
    App(Box<Term>, Box<Term>),
    True,
    False,
    If(Box<Term>, Box<Term>, Box<Term>)
}

#[derive(Debug)]
enum TypeError {
    DEFAULT,
    FN_TYPE_EXPECTED,
    TYPE_MISMATCH
}

// Corresponds to inversation of the tying relation
pub fn check_type(ctx: Context, t: Term) -> Result<Ty, TypeError> {
    match t {
        Term::Var(idx, _ctx_length) => ctx.getType(idx).map_err(|_| TypeError::DEFAULT),
        Term::Abs(binding_name, ty, body) => {
            let new_ctx = ctx.add_binding(binding_name, Binding::TypedVar(ty.clone()));
            let ret_type = check_type(new_ctx, *body)?;
            Ok(Ty::FUNC(Box::new(ty), Box::new(ret_type)))
        },
        Term::App(t1, t2) => {
            let t1_t = check_type(ctx.clone(), *t1)?;
            let t2_t = check_type(ctx, *t2)?;
            if let Ty::FUNC(t11_t, t12_t) = t1_t {
                if *t11_t == t2_t {
                    // Move from the box content into the a normal stack allocated Ty
                    Ok(*t12_t)
                } else {
                    Err(TypeError::TYPE_MISMATCH)
                }
            } else {
                Err(TypeError::FN_TYPE_EXPECTED)
            }
        }
        _ => Ok(Ty::BOOLEAN)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic(){
        check_type(Context(vec![]), Term::True);
    }
}
