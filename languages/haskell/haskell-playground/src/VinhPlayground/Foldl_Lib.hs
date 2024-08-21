module VinhPlayground.Foldl_Lib where
-- https://github.com/Gabriella439/foldl

import qualified Control.Foldl as L
import Control.Applicative (Applicative (..))
import GHC.Generics (Datatype(datatypeName))

-- This library is organised around this main datatype Fold a b =
-- Fold (x -> a -> x) x (x -> b)
-- * a: type of iterable
-- * b: type of final result
--
-- * elements of the foldable are of type a
-- * x is the accumulator type
-- * (x -> b) is the extractor??
--   * Look at the extractor function for mean

-- sum = Fold (+) 0 id
--
-- mean = Fold step begin done
-- where
--   begin = Pair 0 0
--   step (Pair x n) y = let n' = n+1 in Pair (x + (y - x) /n') n'
--   done (Pair x _) = x

-- The functor/applicative instance really focus on the extractor function
-- e.g. fmapping composes on top of (x -> b) so it's like instance Functor (Fold a)

sumAndLength x = L.fold ((,) <$> L.sum <*> L.length) x
sumAndProductAndLength x = L.fold ((,,) <$> L.sum <*> L.product <*> L.length) x
-- liftA2 style:
sumAndLengthA2 x = L.fold (liftA2 (,) L.sum L.length) x

-- One can also meditate on this datatypeName
-- data FoldM m a b = FoldM (x -> a -> m x) (m x) (x -> m b)
--                           acc             init  extractor
--
-- x <- init
-- x <- acc x a1
-- x <- acc x a2
-- ...
-- extractor x
