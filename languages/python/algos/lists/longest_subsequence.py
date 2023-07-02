from typing import Tuple


# Simple
class Solution:
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


assert Solution().lengthOfLongestSubstring("abcabcbb") == 3
assert Solution().lengthOfLongestSubstring("bbbbbb") == 1
assert Solution().lengthOfLongestSubstring("pwwkew") == 3
assert Solution().lengthOfLongestSubstring("aab") == 2
assert Solution().lengthOfLongestSubstring("tmmzuxt") == 5

# Mine
class Solution:
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


assert Solution().lengthOfLongestSubstring("abcabcbb") == 3
assert Solution().lengthOfLongestSubstring("bbbbbb") == 1
assert Solution().lengthOfLongestSubstring("pwwkew") == 3
assert Solution().lengthOfLongestSubstring("aab") == 2
assert Solution().lengthOfLongestSubstring("tmmzuxt") == 5


# Best
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        longest = 0

        current_longest_start = 0
        char_to_idx = {}

        for i in range(len(s)):
            current_char = s[i]
            if char_to_idx.get(current_char, -1) >= current_longest_start:
                current_longest_start = char_to_idx[current_char] + 1
            else:
                longest = max(i - current_longest_start + 1, longest)
            char_to_idx[current_char] = i

        return longest


assert Solution().lengthOfLongestSubstring("abcabcbb") == 3
assert Solution().lengthOfLongestSubstring("bbbbbb") == 1
assert Solution().lengthOfLongestSubstring("tmmzuxt") == 5
assert Solution().lengthOfLongestSubstring("pwwkew") == 3
assert Solution().lengthOfLongestSubstring("aab") == 2
