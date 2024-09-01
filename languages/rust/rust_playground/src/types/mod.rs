#[cfg(test)]
mod tests {
    struct MyStruct {
        pub a: Option<String>,
        pub b: Option<String>,
    }

    // This typechecks while in pyright (as of when I write these lines) it doesn't
    // pyright says the match isn't exhaustive
    fn myfn(m: MyStruct) {
        match m {
            MyStruct {
                a: Some(_a),
                b: Some(_b),
            } => {}
            MyStruct {
                a: None,
                b: Some(_b),
            } => {}
            MyStruct {
                a: Some(_a),
                b: None,
            } => {}
            MyStruct { a: None, b: None } => {}
        }
    }


    #[test]
    fn test() {
        myfn(
            MyStruct {a : Some(String::from("yo")), b: None}
        )
    }
}
