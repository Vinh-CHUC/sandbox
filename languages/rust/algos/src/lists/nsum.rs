use std::collections::HashMap;

pub fn two_sum(l: &Vec<u16>, target: u16) -> Option<(usize, usize)>{
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

#[cfg(test)]
mod tests {
    use super::two_sum;
    use hegel::generators as gs;
    use hegel::TestCase;

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

    #[hegel::test(derandomize = true)]
    fn matches_naive(tc: TestCase) {
        let l = tc.draw(gs::vecs(gs::integers::<u16>()).max_size(100));
        let target = tc.draw(gs::integers::<u16>());

        let expected = naive_two_sum(&l, target);
        let actual = two_sum(&l, target);

        match expected {
            None => assert_eq!(actual, None, "two_sum returned a pair for {:?} / {}", l, target),
            Some((_, _)) => {
                let (a, b) = actual.unwrap_or_else(|| panic!("no pair for {:?} / {}", l, target));
                assert_eq!(l[a], target - l[b], "reported pair is not a solution");
                assert!(a != b);
            }
        }
    }
}
