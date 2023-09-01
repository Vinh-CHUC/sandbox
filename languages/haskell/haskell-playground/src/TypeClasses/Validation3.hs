module TypeClasses.Validation3
    (
        isAnagram,
        isWord,
        areAnagrams,
        run,
    ) where
import Data.Char (isAlpha)
import Data.List (sort)

isAnagram :: String -> String -> Bool
isAnagram word1 word2 = sort word1 == sort word2

isWord :: String -> Maybe String
isWord word = 
    case null word of
        True -> Nothing
        False ->
            case all isAlpha word of
                True -> Just word
                False -> Nothing


areAnagrams :: String -> String -> String
areAnagrams word1 word2 = 
    case isWord word1 of
        Nothing -> "The first word is invalid."
        Just word1 ->
            case isWord word2 of
                Nothing -> "The second word is invalid."
                Just word2 ->
                    case (isAnagram word1 word2) of
                        False -> "These words are not anagrams."
                        True -> "These words are anagrams"

run :: IO ()
run = do
    putStrLn "Please enter a word."
    word1 <- getLine
    putStrLn "Please enter a second word."
    word2 <- getLine
    print (areAnagrams word1 word2)
