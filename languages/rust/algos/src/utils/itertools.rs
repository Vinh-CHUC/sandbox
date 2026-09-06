pub mod cartesian_product {
    // Vec<Vec<>> using iterators
    pub fn basic<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        T: 'a,
        I: Iterator<Item = &'a T> + Clone,
    {
        (0..arity).fold(vec![vec![]], |acc, _| {
            acc.into_iter().flat_map(|prefix| {
                l.clone().map(move |x| {
                    // The move here isn't essential.. clone count is the same
                    // As we do not mutate prefix itself, the function needs not be FnOnce
                    let mut tuple = prefix.clone();
                    tuple.push(x);
                    tuple
                })
            }).collect()
        })
    }

    // Vec<Vec<>> loopy
    pub fn loopy<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        T: 'a,
        I: Iterator<Item = &'a T> + Clone,
    {
        let mut acc = vec![vec![]];

        for _ in 0..arity {
            let mut new_acc = vec![];

            for prefix in acc {
                // Here the need for cloning is because we iterate over l multiple times
                for x in l.clone() {
                    let mut v = prefix.clone();
                    v.push(x);
                    new_acc.push(v);
                }
            }

            // Moved out but we can write into it!
            acc = new_acc;
        }
        acc
    }

    // To confirm Box<dyn Trait> is implicitly Box<dyn Trait + 'a>
    // An Iterator is single-pass, so each level lazily re-clones l (from the
    // pristine original, which itself is never advanced) whenever it fans a prefix
    // out over the element list.
    pub fn lazy<'a, T, I>(l: I, arity: usize) -> Box<dyn Iterator<Item = Vec<&'a T>> + 'a>
    where
        T: 'a,
        I: Iterator<Item = &'a T> + Clone + 'a,
    {
        if arity == 0 {
            Box::new(std::iter::once(vec![]))
        } else {
            // Box itself implement iter, it just delegates to the inner type
            let prev = lazy(l.clone(), arity - 1);
            Box::new(prev.flat_map(move |prefix| {
                l.clone().map(move |x| {
                    let mut tuple = prefix.clone();
                    tuple.push(x);
                    tuple
                })
            }))
        }
    }
}

pub mod combinations {
    pub fn basic<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        T: 'a,
        I: Iterator<Item = &'a T> + Clone
    {
        (0..arity).fold(vec![vec![]], |acc, _| {
            acc.into_iter().flat_map(|prefix| {
                let last_idx = prefix.last().map(|(idx, _)| *idx);
                let skip = last_idx.map_or(0, |idx| idx + 1);

                l.clone().enumerate().skip(skip).map(move |(idx, el)| {
                    let mut new_comb = prefix.clone();
                    new_comb.push((idx, el));
                    new_comb
                })
            }).collect()
        }).into_iter().map(|c| {
            c.into_iter().map(|(_, el)|{
                el
            }).collect()
        }).collect()
    }


    // Vec<Vec<>> loopy
    pub fn loopy<'a, T, I>(l: I, arity: usize) -> Vec<Vec<&'a T>>
    where
        T: 'a,
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

    pub fn lazy<'a, T, I>(l: I, arity: usize) -> Box<dyn Iterator<Item = Vec<&'a T>> + 'a>{
        Box::new(std::iter::once(vec![]))
    }
}

#[cfg(test)]
mod tests {
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

        // C(4, arity) for arity in 0..=5, with arity > len yielding nothing
        let result_sizes = [1, 4, 6, 4, 1, 0];
        for (arity, &r_size) in (0..=5).zip(result_sizes.iter()) {
            assert_eq!(combinations::loopy(l.iter(), arity).len(), r_size);
        }
    }
}
