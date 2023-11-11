{-# LANGUAGE DeriveFunctor #-} 
module TypeClasses.Functortown_B_10 (
    Magic(..),
    Fantastic(..)
) where
import qualified Data.Set as Set
import Data.Set (Set)
-- Homomorphism:
-- - pure f <*> pure x = pure (f x)
--
-- Deriving the applicative functor laws through homomorphism thinking:
--
-- Pure preserves identity
--      pure id x = x 
--
-- Pure preserves apply (unary functions)
--      pure f <*> pure x = pure (f x)
--
-- Pure preserves compose (binary functions)
--      pure ((.) f g) = pure (.) <*> pure f <*> pure g
--
-- Philosophy:
-- - `pure _` is a "dull" value
-- - a and b both dull => a <*> b dull
-- - a dull => a <*> X same "shape" as X
-- - b dull => can rewrite X <*> b as b <*> X where b is dull


-- Similarity with functors and normal composition
--
-- (      (.)     f     g )     x  =  f     ( g     x )  -- 1
-- (      (.)     f     g ) <$> x  =  f <$> ( g <$> x )  -- 2
-- ( pure (.) <*> f <*> g ) <*> x  =  f <*> ( g <*> x )  -- 3
--
-- ($ x) <$> f = f <*> pure x

-- Our fantastic functor
data Magic = Wizard | Unicorn | Leprechaun
    deriving (Eq, Show, Ord)

data Fantastic a = Fantastic (Set Magic) a
    deriving (Functor, Eq, Show)

instance Applicative Fantastic where
    pure = Fantastic Set.empty
    Fantastic magic1 f <*> Fantastic magic2 x =
        Fantastic
            (Set.union magic1 magic2)
            (f x)
