//! Typing-practice snippets that are also compiled, so they cannot rot.
//!
//! Each topic is a module; each snippet is a `fn` preceded by a
//! `// @snippet <reminder>` marker. The `justfile` extracts snippet bodies
//! (dedented, with `// @hide` setup lines removed) and feeds them to `ttyper`.
//!
//! Conventions to keep the extractor happy:
//!   - a snippet `fn` starts at column 0 and its closing `}` is at column 0
//!   - no blank lines inside a snippet body (blank lines separate snippets)
//!   - lines ending in `// @hide` compile but are not typed
#![allow(unused)]

pub mod iterators;
pub mod option;
pub mod ownership;
pub mod rc_box;
pub mod result;
pub mod syntax;
