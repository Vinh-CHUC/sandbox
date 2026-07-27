//! Iterator adaptors and consumers, including a couple from `itertools`.

// @snippet map: transform each element
fn iter_map() {
    let v = vec![1, 2, 3];
    let doubled: Vec<i32> = v.iter().map(|&x| x * 2).collect();
}

// @snippet filter: keep elements matching a predicate
fn iter_filter() {
    let v = vec![1, 2, 3, 4];
    let evens: Vec<i32> = v.iter().copied().filter(|x| x % 2 == 0).collect();
}

// @snippet fold: accumulate into one value with a seed
fn iter_fold() {
    let v = vec![1, 2, 3, 4];
    let sum = v.iter().fold(0, |acc, x| acc + x);
}

// @snippet reduce: like fold but the seed is the first element
fn iter_reduce() {
    let v = vec![1, 2, 3, 4];
    let product = v.iter().copied().reduce(|a, b| a * b);
}

// @snippet zip: pair two iterators element-wise
fn iter_zip() {
    let xs = [1, 2, 3];
    let ys = ["a", "b", "c"];
    let pairs = xs.iter().zip(ys.iter());
}

// @snippet enumerate: attach indices
fn iter_enumerate() {
    let v = vec!["a", "b", "c"];
    for (i, val) in v.iter().enumerate() {
        let _ = (i, val);
    }
}

// @snippet chain: concatenate two iterators
fn iter_chain() {
    let a = [1, 2];
    let b = [3, 4];
    let all = a.iter().chain(b.iter());
}

// @snippet take / skip: limit or drop leading elements
fn iter_take_skip() {
    let v = vec![1, 2, 3, 4, 5];
    let head = v.iter().copied().take(2).collect::<Vec<_>>();
    let tail = v.iter().copied().skip(3).collect::<Vec<_>>();
}

// @snippet step_by: every nth element
fn iter_step_by() {
    let v = vec![1, 2, 3, 4, 5, 6];
    let every_other = v.iter().step_by(2);
}

// @snippet flat_map: map then flatten one level
fn iter_flat_map() {
    let v = vec![1, 2, 3];
    let ranges: Vec<i32> = v.iter().flat_map(|&x| 0..x).collect();
}

// @snippet chunks / windows: fixed-size sliding or disjoint slices
fn slice_chunks_windows() {
    let v = [1, 2, 3, 4, 5];
    for c in v.chunks(2) { let _ = c; }
    for w in v.windows(2) { let _ = w; }
}

// @snippet sorted / sorted_by: order elements (eager, itertools)
fn iter_sorted() {
    use itertools::Itertools;
    let v = vec![3, 1, 2];
    let asc: Vec<i32> = v.iter().copied().sorted().collect();
    let desc: Vec<i32> = v.iter().copied().sorted_by(|a, b| b.cmp(a)).collect();
}

// @snippet partition: split into two collections by a predicate
fn iter_partition() {
    let v = vec![1, 2, 3, 4];
    let (evens, odds): (Vec<_>, Vec<_>) = v.iter().copied().partition(|x| x % 2 == 0);
}

// @snippet peekable: look ahead without consuming
fn iter_peekable() {
    let mut it = vec![1, 2, 3].into_iter().peekable();
    if let Some(p) = it.peek() {
        let _ = p;
    }
}
