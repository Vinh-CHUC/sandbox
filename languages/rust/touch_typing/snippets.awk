# Extract typeable snippet bodies from a touch_typing topic module.
#
# Input:  a topic module, e.g. touch_typing/src/option.rs
# Output: snippet bodies, dedented one level, separated by blank lines.
#
# The shape it expects (enforced by convention, see src/lib.rs):
#
#   // @snippet map: transform the inner value with a closure
#   fn option_map() {
#       let x = Some(5);          <- typed
#       let y = 1; // @hide       <- compiled, not typed
#   }
#
# State machine:
#   pending   -> saw the marker, still skipping the fn signature
#   capturing -> inside the body, emitting dedented lines
#
# A snippet body ends at the first `}` in column 0, which is unambiguous because
# every snippet fn is declared at column 0 and all nested braces are indented.

# The marker line itself is a reading aid, never typed.
/^\/\/ @snippet/ { pending = 1; next }

# Skip the signature (and any attributes) until the brace that opens the body.
pending {
    if (/\{[[:space:]]*$/) {
        pending = 0
        capturing = 1
    }
    next
}

capturing {
    # Column-0 `}` closes the snippet: emit the separator the shuffler needs.
    if ($0 == "}") {
        capturing = 0
        print ""
        next
    }
    # Setup lines exist only to satisfy the compiler.
    if (/\/\/ @hide[[:space:]]*$/) next
    # Undo the fn-body indentation so snippets read as standalone fragments.
    sub(/^    /, "")
    print
}
