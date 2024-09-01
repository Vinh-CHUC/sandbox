module TypeClasses.Functortown_A_4_breaking_the_laws (
    a, b
) where

-- fmap id = id
-- Makes sense otherwise it'd be very surprising the fmap id X != X

-- fmap (g.f) = fmap g. fmap f

data Pair a = Pair a a deriving Show
-- This violates the law
-- Obviously, althought this is quite a silly mistake
-- Doing two consecutive fmaps will not touch the same original value while doing a fmap ((f).(g))
-- would
instance Functor Pair where
    fmap f (Pair l r) = Pair (f r) (f l)


a :: Pair Int
a = fmap ((+(5 :: Int)).(*100)) (Pair 5 100)
b :: Pair Int
b = ((fmap (+(5 :: Int))).(fmap (*100))) (Pair 5 100)

data IncrementPair a = IncrementPair Integer a deriving (Show, Eq)

instance Functor IncrementPair where
    fmap f (IncrementPair int r) = IncrementPair (int + 1) (f r)
