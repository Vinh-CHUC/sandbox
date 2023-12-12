{-# LANGUAGE TypeSynonymInstances, FlexibleInstances #-}

module VinhPlayground.FromTo_LikeInRust where

class To a where
    convertTo :: String -> a

instance To String where
    convertTo str = str

instance To Bool where
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
