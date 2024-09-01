{-# LANGUAGE MultiParamTypeClasses, TypeSynonymInstances, FlexibleInstances #-}

module VinhPlayground.FromTo_LikeInRust (
    f1, f2, Convert(..)
) where

--------------------------------
-- Only one degree of freedom --
--------------------------------
-- String -> a
class Into a where
    convertTo :: String -> a

-- Fails as the the type is not mentioned in the typeclass
-- class From a where
--     convertFrom :: String -> Bool

instance Into String where
    convertTo str = str

instance Into Bool where
    convertTo "True" = True
    convertTo "TRUE" = True
    convertTo "1" = True
    convertTo _ = False

-- This causes a multiple declaration
-- convertTo :: String -> Bool
-- convertTo _ = True

f1 :: Bool
f1 = convertTo "hello"  -- False

f2 :: String
f2 = convertTo "hello"  -- "hello"

-- This will not resolve to the typeclass
-- f3 :: [Int]
-- f3 = convertTo "hello"

-- In Rust it's a bit convoluted I guess given the "redundancy" between Into and From

-----------------------------
-- Two degrees of freedom ---
-----------------------------
class Convert a b where
    convert :: a -> b
