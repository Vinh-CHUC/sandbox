module TypeClasses.Functortown_A_2 (
) where

import Data.Text

_ = fmap (strip.pack) getLine

-- Exercise

data Username a = Username a a deriving Show

instance Functor Username where
    fmap f (Username a b) = Username (f a) (f b)
