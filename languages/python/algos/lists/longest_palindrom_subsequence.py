from functools import lru_cache


class SolutionBruteForce:
    def longestPalindrome(self, s: str) -> str:
        longest = ""

        for start_idx in range(len(s)):
            for end_idx in range(start_idx+1, len(s)):
                sub_s = s[start_idx:end_idx]
                if sub_s == sub_s[::-1]:
                    if len(sub_s) > len(longest):
                        longest = sub_s

        return longest


Solution = SolutionBruteForce

assert Solution().longestPalindrome("babad") == "bab"
assert Solution().longestPalindrome("cbbd") == "bb"

###


# Think of the top-right of a [N;N] matrix where N = len(s)
class SolutionDP:
    def longestPalindrome(self, s: str) -> str:

        @lru_cache(maxsize=None)
        def is_palindrome(start: int, end_incl: int) -> bool:
            if start == end_incl:
                return True
            elif start == end_incl - 1:
                return s[start] == s[end_incl]
            else:
                return (s[start] == s[end_incl]) and is_palindrome(start+1, end_incl-1)

        longest = ""

        for start_idx in range(len(s)):
            for end_idx in range(start_idx+1, len(s)):
                if is_palindrome(start_idx, end_idx - 1) and (end_idx - start_idx) > len(longest):
                    longest = s[start_idx: end_idx]

        return longest


Solution = SolutionDP

assert Solution().longestPalindrome("babad") == "bab"
assert Solution().longestPalindrome("cbbd") == "bb"
