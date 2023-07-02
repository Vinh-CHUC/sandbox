
#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use std::collections::HashSet;
    use std::cmp;

    pub trait Algo {
        fn lengthof_longest_substring(s: &str) -> usize;
    }

    pub struct SimpleSolution {
    }

    impl Algo for SimpleSolution {
        fn lengthof_longest_substring(s: &str) -> usize {
            let mut longest_length = 0;
            for i in 0..s.len() {
                for j in i+1..s.len()+1 {
                    let str_as_set: HashSet<_> = s[i..j].chars().collect();
                    if str_as_set.len() == s[i..j].len() {
                        longest_length = cmp::max(longest_length, j-i); } }
            }
            longest_length 
        }
    }

    //////////////////////////

    pub struct MySolution {
    }

    impl MySolution {
        pub fn _helper(s: &Vec<char>, start_idx: usize) -> (usize, usize) {
            let mut char_to_idx:  HashMap::<char, usize> = HashMap::new();

            let mut longest: usize = 0;
            let mut next_start = s.len();

            for i in start_idx..s.len() {
                let char = s[i];
                if !char_to_idx.contains_key(&char) {
                   char_to_idx.insert(char, i);
                   let curr_l = i - start_idx + 1;
                   longest = cmp::max(curr_l, longest);
                } else {
                    next_start =  char_to_idx[&char] + 1;
                    break;
                }
            }
            (next_start, longest)
        }
    }

    impl Algo for MySolution {
        fn lengthof_longest_substring(s: &str) -> usize {
            let mut longest = 0;
            let chars_v: Vec<_> = s.chars().collect();

            let mut i = 0;
            while i < s.len() {
                let i_longest;
                (i, i_longest) = Self::_helper(&chars_v, i);
                longest = cmp::max(longest, i_longest);
            }
            longest
        }
    }


    /////////////////////////////
    ///
    pub struct BestSolution {
    }

    impl BestSolution {
        fn _lengthof_longest_substring(s: &Vec<char>) -> usize {
            let mut longest = 0;
            let mut char_to_idx:  HashMap::<char, usize> = HashMap::new();
            let mut sequence_start = 0;

            for i in 0..s.len() {
                let char = s[i];

                match char_to_idx.get(&char) {
                    Some(dup) if dup >= &sequence_start => {
                        sequence_start = dup + 1
                    }
                    _ => {
                        longest = cmp::max(i - sequence_start + 1, longest)
                    }
                }

                char_to_idx.insert(char, i);
            }
            longest
        }
    }


    impl Algo for BestSolution {
        fn lengthof_longest_substring(s: &str) -> usize {
            let chars_v: Vec<_> = s.chars().collect();
            Self::_lengthof_longest_substring(&chars_v)
        }
    }


    fn test_helper<T: Algo>() {
        assert_eq!(
            T::lengthof_longest_substring("abcabcbb".into()),
            3
        );
        assert_eq!(
            T::lengthof_longest_substring("bbbbbb".into()),
            1
        );
        assert_eq!(
            T::lengthof_longest_substring("pwwkew".into()),
            3
        );
        assert_eq!(
            T::lengthof_longest_substring("aab".into()),
            2
        );
        assert_eq!(
            T::lengthof_longest_substring("tmmzuxt".into()),
            5
        );
    }


    #[test]
    fn test_dumb_impl(){
        test_helper::<SimpleSolution>();
    }

    #[test]
    fn test_better_impl(){
        test_helper::<MySolution>();
    }

    #[test]
    fn test_best_impl(){
        test_helper::<BestSolution>();
    }
}
