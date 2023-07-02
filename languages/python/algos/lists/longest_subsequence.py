from typing import Tuple


class SolutionSimple:
    def lengthOfLongestSubstring(self, s: str) -> int:
        longest_length = 0
        for i in range(len(s)):
            for j in range(i+1, len(s)+1):
                if len(set(s[i:j])) == len(s[i:j]):
                    if j-i > longest_length:
                        longest_length = j-i
                else:
                    continue
        return longest_length


assert SolutionSimple().lengthOfLongestSubstring("abcabcbb") == 3
assert SolutionSimple().lengthOfLongestSubstring("bbbbbb") == 1
assert SolutionSimple().lengthOfLongestSubstring("pwwkew") == 3


class MySolution:
    # Returns the longest substrings without duplicates starting from start_idx
    # As well as where to start next
    def _helper(self, s, start_idx) -> Tuple[int, int]:
        longest: int = 0
        char_to_idx: dict = {}
        next_start: int = len(s)

        for idx in range(start_idx, len(s)):
            current_char = s[idx]
            if current_char not in char_to_idx:
                char_to_idx[current_char] = idx
                if (curr_l := idx - start_idx + 1) > longest:
                    longest = curr_l
            else:
                next_start = char_to_idx[current_char] + 1
                break

        return next_start, longest

    def lengthOfLongestSubstring(self, s: str) -> int:
        longest_length = 0
        start_idx = 0

        while start_idx < len(s):
            start_idx, longest = self._helper(s, start_idx)
            if longest > longest_length:
                longest_length = longest

        return longest_length


assert MySolution().lengthOfLongestSubstring("abcabcbb") == 3
assert MySolution().lengthOfLongestSubstring("bbbbbb") == 1
assert MySolution().lengthOfLongestSubstring("pwwkew") == 3


class BestSolution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        current_longest_start = 0
        longest = 0
        char_to_idx = {}

        for i in range(len(s)):
            current_char = s[i]
            if current_char in char_to_idx:
                current_longest_start = i + 1
                char_to_idx = {}
            else:
                char_to_idx[current_char] = i
                longest = max(i - current_longest_start + 1, longest)

        return longest


assert BestSolution().lengthOfLongestSubstring("abcabcbb") == 3
assert BestSolution().lengthOfLongestSubstring("bbbbbb") == 1
assert BestSolution().lengthOfLongestSubstring("pwwkew") == 3
