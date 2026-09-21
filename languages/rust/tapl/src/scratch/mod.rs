
#[derive(Clone, PartialEq)]
pub enum Ty {
    BOOLEAN,
    FUNC(Box<Ty>, Box<Ty>)
}

#[derive(Clone, PartialEq)]
pub enum Binding {
    Name,
    TypedVar(Ty)
}

pub struct Context(Vec<(String, Binding)>);

impl Context {
    pub fn add_binding(&mut self, name: String, b: Binding) {
        self.0.push((name, b))
    }

    pub fn getType(&self, idx: usize) -> Result<Ty, String> {
        let b = self.0.get(idx).map(|x| &(x.1)).ok_or_else(|| "Index not found".to_owned())?;
        match b {
            Binding::Name => Err("No type information".to_owned()),
            Binding::TypedVar(ty) => Ok(ty.clone())
        }
    }
}
