//! Moves, borrows, slices, `String`/`&str`, the three `iter` flavors, `Box`.

// @snippet move: assignment transfers ownership of non-Copy types
fn move_semantics() {
    let s1 = String::from("hi");
    let s2 = s1;
}

// @snippet shared borrow: many readers, no mutation
fn shared_borrow() {
    let v = vec![1, 2, 3];
    let (r1, r2) = (&v, &v);
}

// @snippet mutable borrow: exclusive writer
fn mutable_borrow() {
    let mut v = vec![1, 2];
    let r = &mut v;
    r.push(3);
}

// @snippet clone: explicit deep copy when you need both
fn clone_value() {
    let s1 = String::from("hi");
    let s2 = s1.clone();
}

// @snippet slice: borrowed view passed to a function
fn slice_arg() {
    fn sum(s: &[i32]) -> i32 { s.iter().sum() }
    let v = vec![1, 2, 3];
    let n = sum(&v[1..]);
}

// @snippet String vs &str: the common conversions
fn string_conversions() {
    let s: String = "hi".to_string();
    let borrowed: &str = &s;
    let formatted = format!("{s}!");
}

// @snippet iter / iter_mut / into_iter: the three borrow flavors
fn iter_flavors() {
    let mut v = vec![1, 2, 3];
    let refs: Vec<&i32> = v.iter().collect();
    for r in v.iter_mut() { *r += 1; }
    let owned: Vec<i32> = v.into_iter().collect();
}

// @snippet Copy vs Clone: primitives are reused after assignment
fn copy_semantics() {
    let a = 5;
    let b = a;
    let sum = a + b;
}

// @snippet HashMap: insert, get, entry API
fn hashmap_entry() {
    use std::collections::HashMap;
    let mut m: HashMap<&str, i32> = HashMap::new();
    m.insert("a", 1);
    *m.entry("b").or_insert(0) += 1;
}

// @snippet Box: heap-allocate a single owner (move-heavy types)
fn box_owner() {
    let b = Box::new(5);
    let n = *b;
}
