{-# LANGUAGE DeriveFunctor #-}
module TypeClasses.Functortown_A_5_bimap (
    a, b
) where

import Data.Bifunctor

data IncrementPair a b = IncrementPair a b deriving (Show, Eq, Functor)

-- class Bifunctor (p :: * -> * -> *) where
--   bimap :: (a -> b) -> (c -> d) -> p a c -> p b d
--   first :: (a -> b) -> p a c -> p b c
--   second :: (b -> c) -> p a b -> p a c
--   {-# MINIMAL bimap | first, second #-}

instance Bifunctor IncrementPair where
    bimap f g (IncrementPair int r) = IncrementPair (f int) (g r)

a :: IncrementPair Int Int
a = first (+1) (IncrementPair 0 0)
b :: IncrementPair Int Int
b = bimap (+5) (*100) (IncrementPair 0 0)
