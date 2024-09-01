{-# LANGUAGE DeriveFunctor #-}
module TypeClasses.Functortown_B_11 () where

-- Could a "Maybe with 2 Nothings" still be an applicative functors?

data Maybe2 a = Nothing1 | Nothing2 | Just' a
    deriving (Eq, Show, Functor)

instance Applicative Maybe2 where
    pure = Just'
    Just' f <*> x = fmap f x
    Nothing1 <*> _ = Nothing1
    Nothing2 <*> _ = Nothing2
    -- This one below wouldbreak the laws
    -- In particular the "interchange" one
    -- Nothing2 <*> _ = Nothing1
    --
    -- If u = Nothing2
    -- u <*> pure y       ==> Nothing1
    -- (pure ($ y) <*> u) ==> Nothing2


newtype ForgetfulList a = ForgetfulList [a] deriving (Eq, Show, Functor)

instance Applicative ForgetfulList where
    pure x = ForgetfulList [x]
    ForgetfulList [] <*> _ = ForgetfulList []
    -- Forgetting tail of list of functions on purpose
    ForgetfulList (f: _) <*> xs = fmap f xs
    -- Proof that this won't work
    -- "if fx is a pure value", then the lhs structure should be unchanged
