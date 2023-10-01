-- My own spin on top of validation course, wanted to have more explicit types
module TypeClasses.Validation11 (
    validatePasswordLength
) where
import Data.Validation
import Data.Coerce
import Control.Lens
import Test.Hspec (Example)

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

class FoldAB f where
    foldAB :: (a -> c) -> (b -> c) -> f a b -> c

instance FoldAB Either where
    foldAB = either

instance FoldAB Validation where
    foldAB = validation

-- Example use
--
-- display :: Username -> Password -> IO ()
-- display name password =
--     foldAB (\err  -> _ {- Print the error -})
--            (\user -> _ {- Greet the user  -})
--            (makeUser name password)


----------------------
-- The lens library --
----------------------

-- A generalised fmap
-- _Success is a "prism"
_ = over _Success (+ 1) (Success 4)
_ = over _Success (+ 1) (Failure "x")

-- fmap :: Functor f     => (a -> b) -> (f a -> f b)
-- over :: Prism s t a b -> (a -> b) -> (s   -> t)
--
-- More generic types of over necessary when fmapping over Left/Failure for example (as they're
-- bifunctor rather than simple functors?)
--
-- Simple prism type Prism' s a = Prism s s a a
-- Note: we still have to specify a!!!! 
-- Why ???
-- Because s can be an Either a b for example so we need to specify the type of the element that
-- prism looks at

-- preview ~ MaybeAB

---------------------------------------
-- The Either-Validation isomorphism --
---------------------------------------

-- view   :: Iso' s a -> (s -> a)
-- review :: Iso' s a -> (a -> s)

-- Isomorphisms vs coercions
-- coercion => isomorphism
-- isomorphism =/=> coercion (as coercion require newtype relationships between the types)
--
-- for two types there is only one coercion but potentially more than one isomorphism (i.e.
-- view/review)

------------------------
-- The Validate class --
------------------------

-- "Declares" the set of types "f" isomorphic to Validation
-- class Validate f where
--     _Validation :: Iso (f e a) (f g b) (Validation e a) (Validation g b)

-- Example
-- instance Validate Either where
--     _Validation =
--         iso (\either -> case either of
--                 Left  x -> Failure x
--                 Right x -> Success x)
--             (\validation -> case validation of
--                 Failure x -> Left x
--                 Success x -> Right x)

-- Example use
-- makeUser :: Validate v => Username -> Password -> v Error User
-- makeUser name password =
--   review _Validation
--     (User <$> usernameErrors name <*> passwordErrors password)

---------------
-- EXERCICES --
---------------


-- Exercise 1 --
data These a b = This a | That b | These a b

-- Note that These is not isomorphic to Either but can be an instance of LiftAB or MaybeAB

instance LiftAB These where
    liftA = This
    liftB = That

instance MaybeAB These where
    maybeA (This a) = Just a
    maybeA (That _) = Nothing
    maybeA (These a _) = Just a
    maybeB (This _) = Nothing
    maybeB (That b) = Just b
    maybeB (These _ b) = Just b

-- Exercise 2 --
-- Context
newtype Password = Password String deriving (Eq, Show)
checkPasswordLength :: Password -> Maybe Password
checkPasswordLength password =
    case (length (coerce @Password @String password) > 20) of
        True -> Nothing
        False -> Just password

newtype Error = Error [String] deriving (Eq, Show)

-- Solution
validatePasswordLength :: Validate v => Password -> v Error Password
validatePasswordLength password =
    Data.Validation.validate (Error ["String too long"]) checkPasswordLength password
