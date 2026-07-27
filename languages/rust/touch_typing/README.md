# touch_typing

Typing practice for [ttyper](https://github.com/max-niederman/ttyper) where every
snippet is **real, compiled Rust**. Snippets live as functions inside topic
modules, so `just check` proves you are never drilling code that doesn't build.

```bash
cargo install ttyper
```

## Usage (from `languages/rust`)

```bash
just check                # cargo check -p touch_typing: validate every snippet
just practice             # 8 random snippets across all topics
just practice 12          # 12 random snippets
just practice 8 option    # 8 random from the `option` topic
just topics               # list available topics
just drill option         # every snippet in a topic, in order
just all                  # every snippet, in order
just show option          # print extracted snippets without running ttyper
```

## Topics

One module per topic in `src/`:

- `syntax` — `match` (wildcards, OR, guards, `@` binding, struct destructuring), `if let` / `while let`, struct/enum/derive definitions, generics, impl blocks, trait defs, `From`/`Into`, lifetimes, `async`/`.await`, `?` with `From`, `Fn` bounds.
- `ownership` — moves, shared/mutable borrows, `clone`, slices, `String`/`&str` conversions, `iter`/`iter_mut`/`into_iter`, Copy vs Clone, `HashMap` entry API, `Box`.
- `option` — `map`, `and_then`, `filter`, `or`, `take`, `replace`, `unwrap_or`, `ok_or`, `as_ref`, `copied`, `zip`, `flatten`.
- `result` — `map`, `map_err`, `and_then`, `or_else`, `ok`/`err`, `unwrap_or`, `?`, `Into`, `copied`, `as_ref`.
- `rc_box` — `Box`, `Rc` (clone, strong_count, downgrade/upgrade), `RefCell` (borrow/borrow_mut), `Arc`, `Arc<Mutex>`.
- `iterators` — `map`, `filter`, `fold`, `reduce`, `zip`, `enumerate`, `chain`, `take`/`skip`, `step_by`, `flat_map`, `chunks`/`windows`, `sorted`/`sorted_by`, `partition`, `peekable`.

## Snippet format

Each snippet is a function preceded by a `// @snippet` reminder. Lines ending in
`// @hide` are compiled but not typed — they exist to give the snippet the
bindings and types it needs without polluting the practice text.

```rust
// @snippet match on enum variants carrying data
fn match_variant_payload() {
    enum Shape { Circle(f64), Square { side: f64 } } // @hide
    let shape = Shape::Circle(1.5); // @hide
    let area = match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Square { side } => side * side,
    };
}
```

You type only:

```rust
let area = match shape {
    Shape::Circle(r) => std::f64::consts::PI * r * r,
    Shape::Square { side } => side * side,
};
```

Unlike a plain fragment file, imports are part of the snippet, so `use` lines are
typed too — that's deliberate practice, not noise.

### Conventions the extractor relies on

`snippets.awk` is a small state machine, so keep snippets in this shape:

- the snippet `fn` starts at column 0 and its closing `}` is at column 0
  (nested braces are indented, which is what makes the end unambiguous)
- no blank lines inside a body — blank lines are what separate snippets for the
  shuffler
- `#![allow(unused)]` sits in `src/lib.rs`, since most snippets bind values they
  never read

Adding a snippet: write the `fn`, add the `// @snippet` line, run `just check`,
then `just show <topic>` to confirm the typed text looks right.
