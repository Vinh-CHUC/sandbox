use std::collections::HashMap;

pub mod nsum {
    // TODO: k-sum where k is dividable by l > 1, sort + meet in the middle
    #[allow(unused)]
    pub fn naive(l: &[u16], target: u16, nsum: u8) -> Option<Vec<usize>> {
        let indices = Vec::<Vec<usize>>::new();
        for _ in 0..nsum {}
        None
    }
}

pub mod two_sum {
use super::HashMap;

pub fn with_hash_map(l: &Vec<u16>, target: u16) -> Option<(usize, usize)>{
  let mut seen = HashMap::new(); 

  for (idx, i) in l.iter().enumerate() {   
    if let Some(complement) = target.checked_sub(*i) {
        if let Some(&prev) = seen.get(&complement) {
            return Some((prev, idx));
        }
    }
    seen.insert(*i, idx);
  }

  None
}

pub fn with_two_pointers(l: &[u16], target: u16) -> Option<(usize, usize)> {
  let mut v = Vec::from(l);
  v.sort();

  let mut begin = 0;
  let mut end = v.len() - 1;

  while begin < end {
    if let Some(sum) = v[begin].checked_add(v[end]) {
      if sum < target {
        begin += 1;
      } else if sum > target{
        end -= 1;
      } else {
        return Some((begin, end));
      }
    }
  }
  None
}

}

pub mod three_sum {
use super::HashMap;

pub fn basic(l: &[u16], target: u16) -> Option<(usize, usize, usize)>{
  let mut seen = HashMap::new(); 
  for (idx_i, i) in l.iter().enumerate() {
    for idx_j in idx_i+1..l.len() {
      let j = l[idx_j];
      if let Some(sum) = i.checked_add(j) {
          if let Some(complement) = target.checked_sub(sum) {
              if seen.contains_key(&complement) {
                  return Some((seen[&complement], idx_i, idx_j))
              }
          }
      }
    }
    seen.insert(*i, idx_i);
}
None
}

pub fn seen_pairs(l: &[u16], target: u16) -> Option<(usize, usize, usize)>{
  let mut seen = HashMap::new(); 
  for (idx_i, i) in l.iter().enumerate() {

    if let Some(complement) = target.checked_sub(*i){
      if seen.contains_key(&complement) {
        match seen[&complement] {
          (idx_1, idx_2) => return Some((idx_1, idx_2, idx_i))
        }
      }
    }

    for (idx_j, j) in l[..idx_i].into_iter().enumerate() {
      if let Some(complement) = i.checked_add(*j) {
        seen.insert(complement, (idx_j, idx_i));
      }
    }
  }
  None
}

}


// More stuff:
// - k-sum where k is dividable by l > 1
// - sort + meet in the middle with two pointers
//   - go deep! pareto thinggie, product order

#[cfg(test)]
mod tests {
    use super::two_sum;
    use hegel::generators as gs;
    use hegel::TestCase;

    fn naive_three_sum(l: &[u16], target: u16) -> Option<(usize, usize, usize)> {
        for i in 0..l.len() {
            for j in (i + 1)..l.len() {
                for k in (j + 1)..l.len() {
                    let ij = l[i].checked_add(l[j]);
                    if let Some(sum) = ij.and_then(|s| s.checked_add(l[k])) {
                        if sum == target {
                            return Some((i, j, k));
                        }
                    }
                }
            }
        }
        None
    }

    fn naive_two_sum(l: &[u16], target: u16) -> Option<(usize, usize)> {
        for i in 0..l.len() {
            for j in (i + 1)..l.len() {
                if l[i].checked_add(l[j]) == Some(target) {
                    return Some((i, j));
                }
            }
        }
        None
    }

    fn draw_sum_target(tc: &TestCase, l: &[u16], k: usize, guaranteed: bool) -> u16 {
        if guaranteed {
            let idx = tc.draw(gs::vecs(gs::integers::<usize>().max_value(l.len() - 1))
                .min_size(k)
                .max_size(k)
                .unique(true));
            match idx.iter().try_fold(0u16, |acc, &i| acc.checked_add(l[i])) {
                Some(t) => t,
                None => tc.reject(),
            }
        } else {
            tc.draw(gs::integers::<u16>())
        }
    }

    #[hegel::test(derandomize = true)]
    fn two_sum_hash_map_matches_naive(tc: TestCase) {
        let l = tc.draw(gs::vecs(gs::integers::<u16>()).max_size(100));
        tc.assume(l.len() >= 2);
        let guaranteed = tc.draw(gs::booleans());
        let target = draw_sum_target(&tc, &l, 2, guaranteed);

        let expected = naive_two_sum(&l, target);
        let actual = two_sum::with_hash_map(&l, target);

        match expected {
            None => assert_eq!(actual, None, "two_sum returned a pair for {:?} / {}", l, target),
            Some((_, _)) => {
                let (a, b) = actual.unwrap_or_else(|| panic!("no pair for {:?} / {}", l, target));
                assert_eq!(l[a], target - l[b], "reported pair is not a solution");
                assert!(a != b);
            }
        }
    }

    #[hegel::test(derandomize = true)]
    fn two_sum_with_pointers_matches_naive(tc: TestCase) {
        let l = tc.draw(gs::vecs(gs::integers::<u16>()).max_size(100));
        tc.assume(l.len() >= 2);
        let guaranteed = tc.draw(gs::booleans());
        let target = draw_sum_target(&tc, &l, 2, guaranteed);

        let expected = naive_two_sum(&l, target);
        let actual = two_sum::with_hash_map(&l, target);

        match expected {
            None => assert_eq!(actual, None, "two_sum returned a pair for {:?} / {}", l, target),
            Some((_, _)) => {
                let (a, b) = actual.unwrap_or_else(|| panic!("no pair for {:?} / {}", l, target));
                assert_eq!(l[a], target - l[b], "reported pair is not a solution");
                assert!(a != b);
            }
        }
    }

    #[hegel::test(derandomize = true)]
    fn three_sum_matches_naive(tc: TestCase) {
        use super::three_sum;

        let l = tc.draw(gs::vecs(gs::integers::<u16>()).max_size(100));
        tc.assume(l.len() >= 3);

        let guaranteed = tc.draw(gs::booleans());

        let target = draw_sum_target(&tc, &l, 3, guaranteed);

        let expected = naive_three_sum(&l, target);
        let actual = three_sum::basic(&l, target);

        match expected {
            None => assert_eq!(
                actual, None,
                "three_sum returned a triple for {:?} / {}", l, target
            ),
            Some(_) => {
                let (a, b, c) = actual.unwrap_or_else(
                    || panic!("no triple for {:?} / {}", l, target)
                );
                let mut indices = [a, b, c];
                indices.sort_unstable();
                let [i, j, k] = indices;
                assert_eq!(
                    l[i].checked_add(l[j]).and_then(|s| s.checked_add(l[k])),
                    Some(target)
                );
                assert!(a != b && a != c && b != c);
            }
        }
    }

    #[hegel::test(derandomize = true)]
    fn three_sum_with_seen_pairs_matches_naive(tc: TestCase) {
        use super::three_sum;

        let l = tc.draw(gs::vecs(gs::integers::<u16>()).max_size(100));
        tc.assume(l.len() >= 3);

        let guaranteed = tc.draw(gs::booleans());

        let target = draw_sum_target(&tc, &l, 3, guaranteed);

        let expected = naive_three_sum(&l, target);
        let actual = three_sum::seen_pairs(&l, target);

        match expected {
            None => assert_eq!(
                actual, None,
                "three_sum returned a triple for {:?} / {}", l, target
            ),
            Some(_) => {
                let (a, b, c) = actual.unwrap_or_else(
                    || panic!("no triple for {:?} / {}", l, target)
                );
                let mut indices = [a, b, c];
                indices.sort_unstable();
                let [i, j, k] = indices;
                assert_eq!(
                    l[i].checked_add(l[j]).and_then(|s| s.checked_add(l[k])),
                    Some(target)
                );
                assert!(a != b && a != c && b != c);
            }
        }
    }
}
