{-# LANGUAGE DeriveFunctor #-}
module TypeClasses.Functortown_B_4_zippy_applicatives (
) where

import Control.Applicative hiding (ZipList (..))

-- Revisiting again the duality between <*> and liftA2

_ = liftA2 (+) [1, 3, 5] [2, 4, 6]
_ = [(+1), (+3), (+5)] <*> [2, 4, 6]

-- Contrast the difference with zipWith
--
-- Which is the ZipList applicative!
_ = zipWith (+) [1, 3, 5] [2, 4, 6] 


-- Exercise 1
zipWith2 :: (a -> b -> c) -> [a] -> [b] -> [c]
zipWith2 _ [] _ = []
zipWith2 _ _ [] = []
zipWith2 f (a:as) (b:bs) = (f a b) : zipWith2 f as bs

-- Exercise 2
newtype ZipList a = ZipList { getZipList:: [a]} deriving (Show, Functor)

instance Applicative ZipList where
    pure x = ZipList (repeat x)
    ZipList _ <*> ZipList [] = ZipList []
    ZipList [] <*> ZipList _ = ZipList []
    ZipList (f: fs) <*> ZipList (a: as) = ZipList ((f a) : (getZipList (ZipList fs <*> ZipList as)))
