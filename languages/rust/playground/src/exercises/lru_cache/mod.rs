use std::rc::Rc;


pub struct DLLEl<T> {
    pub val: T,
    pub prev: Option<Rc<DLLEl<T>>>,
    pub next: Option<Rc<DLLEl<T>>>,
}

impl<T> DLLEl<T> {
    pub fn new(val: T) -> DLLEl<T> {
        DLLEl{val, prev: None, next: None}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dll_basics() {
        let s = DLLEl::new(3);
    }
}
