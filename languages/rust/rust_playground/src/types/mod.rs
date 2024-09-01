#[cfg(test)]
mod tests {
    struct MyStruct {
        pub a: Option<String>,
        pub b: Option<String>,
        pub c: usize,
    }

    // This typechecks while in pyright (as of when I write these lines) it doesn't
    // pyright says the match isn't exhaustive
    fn myfn(m: MyStruct) {
        match m {
            MyStruct {
                a: Some(a),
                b: Some(b),
            } => {}
            MyStruct {
                a: None,
                b: Some(b),
            } => {}
            MyStruct {
                a: Some(a),
                b: None,
            } => {}
            MyStruct { a: None, b: None } => {}
        }
    }
}
