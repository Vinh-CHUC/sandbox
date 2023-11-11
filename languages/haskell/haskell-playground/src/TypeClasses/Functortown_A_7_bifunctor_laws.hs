module TypeClasses.Functortown_A_7_bifunctor_laws (
    These (..)
) where

import Data.Bifunctor

data These a b = This a | That b | These a b deriving (Eq, Show)

instance Functor (These a) where
    fmap _ (This a) = This a
    fmap f (That b) = That $ f b
    fmap f (These a b) = These a $ f b

instance Bifunctor These where
    bimap f _ (This a) = This $ f a
    bimap _ g (That b) = That $ g b
    bimap f g (These a b) = These (f a) (g b)
