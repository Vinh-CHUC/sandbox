pub mod cartesian_product {
    use itertools::Itertools;

    // Vec<Vec<>> using iterators
    pub fn basic<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        I: Iterator<Item = &'a T> + Clone,
    {
        (0..arity).fold(vec![vec![]], |acc, _| {
            acc.into_iter().flat_map(|comb|
                // This move is not useful for perf
                // But is required to compile |comb| goes out of scope by the time the inner
                // iterator gets walked over
                l.clone().map(move |el| {
                    let mut new_comb = comb.clone();
                    new_comb.push(el);
                    new_comb
                }).collect_vec()
            ).collect_vec()
        })
    }

    // Vec<Vec<>> loopy
    pub fn loopy<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        I: Iterator<Item = &'a T> + Clone,
    {
        let mut result = vec![vec![]];

        for _ in 0..arity {
            let mut new_result = vec![];

            // This works too
            // for prefix in &result {
            for prefix in result {
                // Here the need for cloning is because we iterate over l multiple times over l
                for el in l.clone() {
                    let mut new_comb = prefix.clone();
                    new_comb.push(el);
                    new_result.push(new_comb);
                }
            }
            // Moved out but we can write into it!
            // Rust analysis the dataflow and understand that result is valid again at the end of
            // the loop body, thus ready to be iterated again in the next iteration of arity
            result = new_result;
        }
        result
    }

    // To confirm Box<dyn Trait> is by default Box<dyn Trait + 'static>, due to type erasure Rust
    // can't really know about references lifetimes held by the dyn object. So it picks the default
    // of "there is borrowed data inside" (except 'static)
    //
    // An Iterator is single-pass, so each level lazily re-clones l (from the
    // pristine original, which itself is never advanced) whenever it fans a prefix
    // out over the element list.
    pub fn lazy<'a, T, I>(l: I, arity: usize) -> Box<dyn Iterator<Item = Vec<&'a T>> + 'a>
    where
        // Note the 'a here for I:
        // - I outlives 'a <==> any references in I must outlive 'a
        //
        // To satisfy the Box<dyn ... 'a> its internals, here the l.clone().map() must also satisfy
        // that constraint
        I: Iterator<Item = &'a T> + Clone + 'a,
    {
        if arity == 0 {
            Box::new(std::iter::once(vec![]))
        } else {
            // Box itself implement iter, it just delegates to the inner type
            let prev = lazy(l.clone(), arity - 1);
            // Contrary to basic the flat_map closure here outlives this function, so it's got to
            // own l
            Box::new(prev.flat_map(move |prefix|
                l.clone().map(move |el| {
                    let mut new_comb = prefix.clone();
                    new_comb.push(el);
                    new_comb
                })
            ))
        }
    }
}

pub mod combinations {
    use itertools::Itertools;

    pub fn basic<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        I: Iterator<Item = &'a T> + Clone
    {
        let with_idxs = (0..arity).fold(vec![vec![]], |acc, _| {
            acc.into_iter().flat_map(|prefix| {
                let skip = prefix.last().map_or(0, |(idx, _)| *idx + 1);
                l.clone().enumerate().skip(skip).map(move |(idx, el)| {
                   let mut new_comb = prefix.clone(); 
                   new_comb.push((idx, el));
                   new_comb
                })
            }).collect_vec()
        });

        with_idxs.into_iter().map(|comb| {
            comb.into_iter().map(|(_, el)| el).collect_vec()
        }).collect_vec()
    }


    // Vec<Vec<>> loopy
    pub fn loopy<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        I: Iterator<Item = &'a T> + Clone,
    {
        let mut acc = vec![vec![]];

        for _ in 0..arity {
            let mut new_acc = vec![];

            for prefix in acc {
                let last_idx = prefix.last().map(|(idx, _)| *idx);
                let skip = match last_idx { None => 0, Some(x) => x + 1 };
                for (idx, x) in l.clone().enumerate().skip(skip) {
                    let mut v = prefix.clone();
                    v.push((idx, x));
                    new_acc.push(v);
                }
            }

            // Moved out but we can write into it!
            acc = new_acc;
        }

        acc.into_iter().map(|comb|{
            comb.into_iter().map(|(_, v)| v).collect()
        }).collect()
    }

    pub fn _lazy<'a, T, I>(l: I, arity: usize) -> Box<dyn Iterator<Item = Vec<(usize, &'a T)>> + 'a>
    where
        // the 'a on I itself necessary! as the iterator is lazily evaluated
        I: Iterator<Item = &'a T> + Clone + 'a
    {
        if arity == 0 {
            Box::new(std::iter::once(vec![]))
        } else {
            let prev = _lazy(l.clone(), arity - 1);

            Box::new(prev.flat_map(move |prefix| {  // move l: I not really essential?
                                                    //
                let last_idx = prefix.last().map(|(idx, _)| *idx);
                let skip = last_idx.map_or(0, |idx| idx + 1);

                l.clone().enumerate().skip(skip).map(
                    move |(idx, el)| {  // Move the prefix not super essential
                        let mut new_comb = prefix.clone();
                        new_comb.push((idx, el));
                        new_comb
                    }
                )
            }))
        }
    }

    pub fn lazy<'a, T, I>(l: I, arity: usize) -> Box<dyn Iterator<Item = Vec<&'a T>> + 'a>
    where
        I : Iterator<Item = &'a T> + Clone + 'a
    {
        Box::new(_lazy(l, arity).map(
            |v| {
                v.into_iter().map(|(_, el)| el).collect()
            }
        ))
    }
}

#[cfg(test)]
mod tests {
    use itertools::Itertools;

    use super::*;

    #[test]
    fn all_three_agree() {
        let l = [10u16, 20, 30];
        for arity in 0..=3 {
            let eager = cartesian_product::basic(l.iter(), arity);
            let loopy = cartesian_product::loopy(l.iter(), arity);
            let lazy: Vec<Vec<&u16>> = cartesian_product::lazy(l.iter(), arity).collect();
            assert_eq!(lazy, loopy);
            assert_eq!(eager, loopy);
            assert_eq!(lazy.len(), l.len().pow(arity as u32));
        }
    }

    #[test]
    fn combinations_loopy_matches_expected() {
        let l = [10u16, 20, 30, 40];

        // arity = 2: strictly increasing index picks, order-insensitive
        let expected: Vec<Vec<&u16>> = vec![
            vec![&l[0], &l[1]],
            vec![&l[0], &l[2]],
            vec![&l[0], &l[3]],
            vec![&l[1], &l[2]],
            vec![&l[1], &l[3]],
            vec![&l[2], &l[3]],
        ];
        assert_eq!(combinations::loopy(l.iter(), 2), expected);
        assert_eq!(combinations::basic(l.iter(), 2), expected);
        assert_eq!(combinations::lazy(l.iter(), 2).collect_vec(), expected);

        // C(4, arity) for arity in 0..=5, with arity > len yielding nothing
        let result_sizes = [1, 4, 6, 4, 1, 0];
        for (arity, &r_size) in (0..=5).zip(result_sizes.iter()) {
            assert_eq!(combinations::loopy(l.iter(), arity).len(), r_size);
            assert_eq!(combinations::basic(l.iter(), arity).len(), r_size);
            assert_eq!(combinations::lazy(l.iter(), arity).collect_vec().len(), r_size);
        }
    }
}
