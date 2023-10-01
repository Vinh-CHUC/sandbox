-- My own spin on top of validation course, wanted to have more explicit types
module TypeClasses.Validation_11 (
) where
import Data.Validation

-- Similarities between the Validation and Either TypeClasses
-- As in a way there are both plain sum types with two sides

class LiftAB f where
    liftA :: a -> f a b
    liftB :: b -> f a b

instance LiftAB Validation where
    liftA = Failure
    liftB = Success

instance LiftAB Either where
    liftA = Left
    liftB = Right

class MaybeAB f where
    maybeA :: f a b -> Maybe a
    maybeB :: f a b -> Maybe b

instance MaybeAB Validation where
    maybeA (Failure a) = Just a
    maybeA (Success _) = Nothing
    maybeB (Failure _) = Nothing
    maybeB (Success b) = Just b

instance MaybeAB Either where
    maybeA (Left a) = Just a
    maybeA (Right _) = Nothing
    maybeB (Left _) = Nothing
    maybeB (Right b) = Just b

-- Generalising folds
-- foldr :: Foldable t => (a -> b -> b) -> b -> t a -> b
-- maybe :: b -> (a -> b) -> Maybe a -> b
-- either :: (a -> c) -> (b -> c) -> Either a b -> c
--
-- foldr/Foldable has a different signature because there are multiple elements (usually)
-- for maybe there's only one so we don't need an "a->b->b" but just an "a->b", and a default b
-- for either, "a->c" and a "b->c"
