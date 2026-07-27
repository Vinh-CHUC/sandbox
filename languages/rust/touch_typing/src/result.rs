//! `Result` combinators plus the `?` operator and error conversion.

// @snippet map: transform the Ok value
fn result_map() {
    let r: Result<i32, String> = Ok(5);
    let inc = r.map(|v| v + 1);
}

// @snippet map_err: transform the Err value
fn result_map_err() {
    let r: Result<i32, String> = Err("nope".into());
    let pretty = r.map_err(|e| format!("error: {e}"));
}

// @snippet and_then: chain fallible steps (?-like, but as a combinator)
fn result_and_then() {
    let r: Result<i32, String> = Ok(3);
    let chained = r.and_then(|v| if v > 0 { Ok(v * 2) } else { Err("neg".into()) });
}

// @snippet or_else: recover from an error with a fallback Result
fn result_or_else() {
    let r: Result<i32, String> = Err("oops".into());
    let recover = r.or_else(|_| Ok::<i32, String>(0));
}

// @snippet ok / err: drop one side to get an Option
fn result_ok_err() {
    let r: Result<i32, String> = Ok(5);
    let just_ok = r.ok();
}

// @snippet unwrap_or: default on Err
fn result_unwrap_or() {
    let r: Result<i32, String> = Err("x".into());
    let v = r.unwrap_or(0);
}

// @snippet ? operator: propagate errors early from a function
fn result_question_mark() {
    fn parse(s: &str) -> Result<i32, std::num::ParseIntError> {
        let n: i32 = s.parse()?;
        Ok(n * 2)
    }
}

// @snippet Into: convert error types in map_err
fn result_into_error() {
    struct MyError(String); // @hide
    impl From<String> for MyError { // @hide
        fn from(v: String) -> Self { Self(v) } // @hide
    } // @hide
    let r: Result<i32, String> = Err("e".into());
    let mapped: Result<i32, MyError> = r.map_err(Into::into);
}

// @snippet copied / cloned: lift out of Result<&T, E>
fn result_copied() {
    let r: Result<&i32, String> = Ok(&5);
    let owned: Result<i32, String> = r.copied();
}

// @snippet as_ref: borrow as Result<&T, &E>
fn result_as_ref() {
    let r: Result<i32, String> = Ok(5);
    let borrowed: Result<&i32, &String> = r.as_ref();
}
