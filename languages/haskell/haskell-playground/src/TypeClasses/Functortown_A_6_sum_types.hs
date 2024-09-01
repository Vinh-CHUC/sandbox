module TypeClasses.Functortown_A_6_sum_types (
    m, n, mn, foldunalign, myunalign
) where

import Data.Align
import Data.These

-- data These a b = This a | That b | These a b deriving (Eq, Show)

-- Exercise
-- instance Functor (These a) where
--     fmap _ (This a) = This a
--     fmap f (That b) = That (f b)
--     fmap f (These a b) = These a (f b)

-- instance Bifunctor These where
--     bimap f g (These a b) = These (f a) (g b)
--     bimap f _ (This a) = This (f a)
--     bimap _ g (That b) = That (g b)

--  align :: f a -> f b -> f (These a b)
--  alignWith :: (These a b -> c) -> f a -> f b -> f c

-- Exercise 1

-- instance Align (Either a) where
--     align :: Either a b -> Either a c -> Either a (T.These b c)
--     align (Left x) (Left x') = Left x -- Arbitrary choice
--     align (Right x) (Left x') = Right (This x)
--     align (Left x) (Right x') = Right (That x)
--     align (Right x) (Right x') = Right (These x x')

-- Exercise 2

data Pair a = Zero | Pair a a deriving Show

instance Functor Pair where
    fmap _ Zero = Zero
    fmap f (Pair a1 a2) = Pair (f a1) (f a2)

-- Won't compile not sure why

-- instance Align Pair where
--     align _ Zero Zero = Zero
--     align Zero (Pair b1 b2) = Pair (That b1) (That b2)
--     align (Pair a1 a2) Zero = Pair (This a1) (This a2)
--     align (Pair a1 a2) (Pair b1 b2) = Pair (These a1 b1) (These a2 b2)

-- My custom exercises!!!

myunalign :: [These x y] -> ([x], [y])
myunalign [] = ([], [])
myunalign ((These a b) : xs) =
    let (as, bs) = myunalign xs
    in  (a: as, b: bs)
myunalign ((This a) : xs) =
    let (as, bs) = myunalign xs
    in  (a: as, bs)
myunalign ((That b) : xs) =
    let (as, bs) = myunalign xs
    in  (as, b: bs)

foldunalign :: ([x], [y]) -> (These x y) -> ([x], [y])
foldunalign (xs, ys) (These x y) = ([x] ++ xs, [y] ++ ys)
foldunalign (xs, ys) (This x) = ([x] ++ xs, ys)
foldunalign (xs, ys) (That y) = (xs, [y] ++ ys)

m :: [Int]
m = take 10 (repeat 5)
n :: [Int]
n = take 20 (repeat 1)
mn :: [These Int Int]
mn = align m n
