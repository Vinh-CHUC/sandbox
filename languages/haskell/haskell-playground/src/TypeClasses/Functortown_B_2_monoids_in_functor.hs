module TypeClasses.Functortown_B_2_monoids_in_functor (
) where
import Control.Applicative

-- Remember the definition of liftA2 :: (a -> b -> c) -> f a -> f b -> f c
-- And the duality with <*> :: f (a -> b) -> f a -> f b
-- Notice: String -> String -> Person

data Person = Person {
    name :: String,
    pl :: String
} deriving (Eq, Show)

nonEmpty :: String -> Either String String
nonEmpty str =
    case null str of
        True -> Left "Error: Empty string."
        False -> Right str

mkPerson :: String -> String -> Either String Person
mkPerson name' pl' = liftA2 Person (nonEmpty name') (nonEmpty pl')

-- or a more idiomatic version
mkPerson2 :: String -> String -> Either String Person
mkPerson2 name' pl' =
    Person <$> (nonEmpty name')
        <*> (nonEmpty pl')

-- More complex use cases of applicative
--
-- The first element is the context, and we want to combine it?
-- In case of Maybe/Either this is irrelevant, as they're sum types there's only one value at a
-- time
--
-- fmap doesn't have a choice in a way, it has to act on only one element, otherwise tuple would be
-- forced to have uniform types
-- But once we fmap, the (a -> b) is then wrapped in the context f(a -> b)!
-- We do deal with two things in the functor context, the function and another value
_ = liftA2 (<) ("vinh", 1) (" chuc", 2)  -- => ("vinhchuc", True) !!! wut??

-- For the 2-elements tuple, the first then has to be a monoid, it gives a way to combine these

-- instance Monoid a => Applicative ((,) a) where
--     pure x = (mempty, x)

-- Practice!!!
-- instance Monoid a => Applicative ((,) a) where
--     pure x = (mempty, x)
--     liftA2 f (a1, b) (a2, c) = (a1 <> a2, f b c) 
--     (a1, f) <*> (a2, b) = (a1 <> a2, f b)
