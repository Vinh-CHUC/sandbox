module TypeClasses.Functortown_B_6 (
) where

import Data.List (sort)
import Data.Char (isAlpha, toUpper)

alphabetize :: Ord a => a -> a -> [a]
alphabetize name1 name2 = sort [name1, name2]

alphabetizeIO:: IO [String]
alphabetizeIO =
    pure alphabetize <*> getLine <*> getLine

-- Functors composition
_ = fmap head ["vinh", "chuc"]
_ = (fmap . fmap) toUpper (["vinh", "chuc"])
-- to meditate it looks weird because of currying:
_ = ((fmap .fmap) toUpper) ["vinh", "chuc"]
--                ------- Char -> Char
--          ------------- String -> String
--    ------------------- [String] -> [String]

-- Generalising things
-- (fmap @G . fmap @F) (a -> b) G[F[a]] -> G[F[b]]
alphabetizeMaybe :: String -> String -> Maybe [String]
alphabetizeMaybe name1 name2 =
    case (all isAlpha name1) && (all isAlpha name2) of
        True -> Just (alphabetize name1 name2)
        False -> Nothing

alphabetizeMaybeIO :: IO (Maybe [String])
alphabetizeMaybeIO =
    pure alphabetizeMaybe <*> getLine <*> getLine
