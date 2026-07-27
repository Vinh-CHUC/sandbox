//! Pattern matching, item definitions, generics, lifetimes, async, trait bounds.

// @snippet match: exhaustive pattern matching on enums
fn match_exhaustive() {
    let opt = Some(5);
    let n = match opt {
        Some(v) => v,
        None => 0,
    };
}

// @snippet match with wildcard + OR patterns
fn match_wildcard_or() {
    let x = 2; // @hide
    let s = match x {
        0 => "zero",
        1 | 2 => "small",
        _ => "many",
    };
}

// @snippet match on enum variants carrying data
fn match_variant_payload() {
    enum Shape { Circle(f64), Square { side: f64 } } // @hide
    let shape = Shape::Circle(1.5); // @hide
    let area = match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Square { side } => side * side,
    };
}

// @snippet match guard: extra predicate on a pattern
fn match_guard() {
    let (a, b) = (1, 2); // @hide
    let s = match (a, b) {
        (a, b) if a < b => "ascending",
        (a, b) if a > b => "descending",
        _ => "equal",
    };
}

// @snippet @ binding: bind a subrange while matching
fn match_at_binding() {
    let n = 42; // @hide
    let s = match n {
        lo @ 0..=9 => format!("low {lo}"),
        hi @ 10..=100 => format!("high {hi}"),
        _ => "out of range".to_string(),
    };
}

// @snippet struct destructuring with ..
fn struct_destructuring() {
    struct Pt { x: i32, y: i32 } // @hide
    let p = Pt { x: 1, y: 2 }; // @hide
    let Pt { x, .. } = p;
}

// @snippet if let: handle one pattern, ignore the rest
fn if_let() {
    let opt = Some(5); // @hide
    if let Some(n) = opt {
        println!("{n}");
    }
}

// @snippet while let: loop until a pattern stops matching
fn while_let() {
    let mut it = vec![1, 2, 3].into_iter(); // @hide
    while let Some(n) = it.next() {
        println!("{n}");
    }
}

// @snippet struct + enum + tuple-variant definitions
fn item_definitions() {
    struct User { name: String, age: u32 }
    enum Shape { Circle(f64), Square { side: f64 } }
}

// @snippet derive: auto-implement common traits
fn derive_attribute() {
    #[derive(Debug, Clone, PartialEq)]
    struct Point { x: i32, y: i32 }
}

// @snippet generic function
fn generic_fn() {
    fn first<T>(xs: &[T]) -> Option<&T> {
        xs.first()
    }
}

// @snippet impl block with Self
fn impl_block() {
    struct Point { x: i32, y: i32 } // @hide
    impl Point {
        fn new(x: i32, y: i32) -> Self {
            Self { x, y }
        }
    }
}

// @snippet trait definition + impl for a type
fn trait_impl() {
    struct User { name: String, age: u32 } // @hide
    trait Greet {
        fn hello(&self) -> String;
    }
    impl Greet for User {
        fn hello(&self) -> String { format!("hi {}", self.name) }
    }
}

// @snippet From/Into impl: idiomatic type conversion
fn from_into() {
    struct Meters(u32); // @hide
    impl From<u32> for Meters {
        fn from(v: u32) -> Self { Self(v) }
    }
    let m: Meters = 5.into();
}

// @snippet lifetimes in a function signature
fn lifetime_fn() {
    fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
        if a.len() > b.len() { a } else { b }
    }
}

// @snippet struct carrying a lifetime
fn lifetime_struct() {
    struct Parser<'a> { src: &'a str }
}

// @snippet async fn + .await
fn async_await() {
    async fn fetch(n: u32) -> u32 { n + 1 }
    let v = async { fetch(3).await };
}

// @snippet ? with implicit From error conversion
fn question_mark_from() {
    fn parse(s: &str) -> Result<i32, Box<dyn std::error::Error>> {
        Ok(s.parse::<i32>()?)
    }
}

// @snippet Fn trait bound on a higher-order function
fn fn_trait_bound() {
    fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 { f(x) }
    let y = apply(|n| n + 1, 5);
}
