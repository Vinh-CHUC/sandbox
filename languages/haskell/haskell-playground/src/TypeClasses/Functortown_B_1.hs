module TypeClasses.Functortown_B_1 (
) where

import Data.List (sortBy)
import Data.Function (on)
import Numeric.Natural
import Data.Functor.Classes (Read1(liftReadPrec))

data User = User {
    name :: String,
    surname :: String,
    age :: Natural,
    beta :: Bool,
    admin :: Bool
} deriving (Show, Eq)

userList :: [User]
userList = [
          User "Julie" "Moronuki" 74 False True,
          User "Chris" "Martin" 25 False True,
          User "Alonzo" "Church" 100 True False,
          User "Alan" "Turing" 99 True False,
          User "Melman" "Fancypants" 0 False False
    ]

fetchUsers :: String -> Maybe [User]
fetchUsers query =
  case query of
    "allusers" -> Just userList
    "betausers" -> Just (filter beta userList)
    "admins" -> Just (filter admin userList)
    _ -> Nothing

readSortMaybe :: String -> Maybe ([User] -> [User])
readSortMaybe ordering =
    case ordering of
        -- sortBy (a -> a -> Ordering) -> [a] -> [a]
        -- on (b -> b -> Ordering) -> (User -> b) -> User -> User -> Ordering
        "surname" -> Just (sortBy (compare `on` surname))
        "age" -> Just (sortBy (compare `on` age))
        _ -> Nothing


liftAp :: Maybe (a -> b) -> Maybe a -> Maybe b
liftAp _ Nothing = Nothing
liftAp Nothing _ = Nothing
liftAp (Just f) (Just a) = Just $ f a

sortUsers :: String -> String -> Maybe [User]
sortUsers ordering query =
    liftAp
    (readSortMaybe ordering)
    (fetchUsers query)

-- Exercises

myLiftA2 :: (a -> b -> c) -> Maybe a -> Maybe b -> Maybe c
myLiftA2 f (Just a) (Just b) = Just (f a b)
myLiftA2 _ _ _ = Nothing

data Either2 a b = Left2 a | Right2 b deriving Show


instance Functor (Either2 a) where
    fmap f (Right2 b) = Right2 (f b)
    fmap f (Left2 a) = Left2 a

instance Applicative (Either2 a) where
    pure = Right2
    Left2 f <*> _ = Left2 f
    _ <*> Left2 x = Left2 x
    Right2 f <*> Right2 b = Right2 (f b) 
