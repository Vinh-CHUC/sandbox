//! `Option` combinators: transform, chain, filter, fall back, convert.

// @snippet map: transform the inner value with a closure
fn option_map() {
    let x = Some(5);
    let doubled = x.map(|v| v * 2);
}

// @snippet and_then: chain fallible operations that return Option
fn option_and_then() {
    let parsed: Option<i32> = "5".parse().ok();
    let inc = parsed.and_then(|v| if v > 0 { Some(v + 1) } else { None });
}

// @snippet filter: keep Some only if the predicate holds
fn option_filter() {
    let x = Some(4);
    let even = x.filter(|&v| v % 2 == 0);
}

// @snippet or: fall back to another Option if this one is None
fn option_or() {
    let a: Option<i32> = None;
    let b = Some(7);
    let pick = a.or(b);
}

// @snippet take: leave None behind, return the original Some
fn option_take() {
    let mut x = Some(3);
    let took = x.take();
    assert!(x.is_none());
}

// @snippet replace: swap in a new Some, return the old one
fn option_replace() {
    let mut x = Some(1);
    let old = x.replace(9);
}

// @snippet unwrap_or: default value on None
fn option_unwrap_or() {
    let x: Option<i32> = None;
    let v = x.unwrap_or(0);
}

// @snippet ok_or: convert Option to Result with a fixed error
fn option_ok_or() {
    let x: Option<i32> = None;
    let r: Result<i32, &str> = x.ok_or("missing");
}

// @snippet as_ref: borrow the inner value as Option<&T>
fn option_as_ref() {
    let x = Some(String::from("hi"));
    let r: Option<&String> = x.as_ref();
}

// @snippet copied/cloned: lift Copy/Clone out of an Option<&T>
fn option_copied() {
    let x = Some(&5);
    let owned: Option<i32> = x.copied();
}

// @snippet zip: pair two Options into Option<(T, U)>
fn option_zip() {
    let a = Some(1);
    let b = Some(2);
    let pair = a.zip(b);
}

// @snippet flatten: collapse Option<Option<T>> into Option<T>
fn option_flatten() {
    let nested = Some(Some(8));
    let flat = nested.flatten();
}
