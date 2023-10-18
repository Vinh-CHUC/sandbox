{-# LANGUAGE InstanceSigs #-}
module TypeClasses.Functortown_B_6 (
) where

import Control.Applicative (Applicative (..))
import Data.List (sort)
import Data.Char (isAlpha, toUpper)
import Test.Hspec (xit)

alphabetize :: Ord a => a -> a -> [a]
alphabetize name1 name2 = sort [name1, name2]

alphabetizeIO:: IO [String]
alphabetizeIO =
    pure alphabetize <*> getLine <*> getLine

-- Functors composition
_ = fmap head ["vinh", "chuc"]
_ = (fmap . fmap) toUpper (["vinh", "chuc"])
-- to meditate it looks weird because of currying:
_ = ((fmap .fmap) toUpper) ["vinh", "chuc"]
--                ------- Char -> Char
--          ------------- String -> String
--    ------------------- [String] -> [String]
--
-- Generalising things
-- (fmap @G . fmap @F) (a -> b) G[F[a]] -> G[F[b]]

alphabetizeMaybe :: String -> String -> Maybe [String]
alphabetizeMaybe name1 name2 =
    case (all isAlpha name1) && (all isAlpha name2) of
        True -> Just (alphabetize name1 name2)
        False -> Nothing

alphabetizeMaybeIO :: IO (Maybe [String])
alphabetizeMaybeIO =
    -- Note here this is not an applicative compose, getLine still return IO String
    -- It's just the return type of alphabetizeMaybe that switched
    -- from:   a -> a -> [a]
    -- to:     a -> a -> Maybe [a]
    pure alphabetizeMaybe <*> getLine <*> getLine

-------------------------
-- A whole new functor --
-------------------------

newtype MaybeList a = MaybeList (Maybe [a]) deriving Show

instance Functor MaybeList where
    -- fmap _ (MaybeList Nothing) = MaybeList Nothing
    -- fmap f (MaybeList (Just xs)) = MaybeList $ Just $ mapF xs
    --     where
    --         mapF [] = []
    --         mapF (y: ys) = f y : mapF ys
    fmap f (MaybeList xs) = MaybeList (fmap (fmap f) xs)

-- Exercise 1
instance Applicative MaybeList where
    pure a = MaybeList $ Just [a]
    MaybeList _ <*> MaybeList Nothing = MaybeList Nothing
    MaybeList Nothing <*> MaybeList _ = MaybeList Nothing
    MaybeList (Just fs) <*> MaybeList (Just xs) = MaybeList (Just (fs <*> xs))

--

newtype ReaderIO env a = ReaderIO (env -> IO a)
runReaderIO (ReaderIO f) env = f env

instance Functor (ReaderIO env) where
    fmap :: (a -> b) -> ReaderIO env a
                     -> ReaderIO env b
    fmap f (ReaderIO g) = ReaderIO (fmap f . g)

instance Applicative (ReaderIO env) where
    pure :: a -> ReaderIO env a
    pure x = ReaderIO (\_ -> pure x)
    liftA2 :: (a -> b -> c)
        -> ReaderIO env a
        -> ReaderIO env b
        -> ReaderIO env c
    liftA2 f (ReaderIO g) (ReaderIO h) =
        ReaderIO $ \env -> f <$> g env <*> h env

data Order = Alphabetical | Forward | Reverse
arrange :: Order -> String -> String -> [String]
arrange Forward x y = [x, y]
arrange Reverse x y = [y, x]
arrange Alphabetical x y = sort [x, y]

data LineLimit = NoLimit | MaxLength Int
applyLineLimit :: LineLimit -> String -> String
applyLineLimit NoLimit x = x
applyLineLimit (MaxLength n) x = take n x

data Config = Config {
    configOrder:: Order,
    configLineLimit :: LineLimit
}

arrange' :: Config -> String -> String -> [String]
arrange' config = arrange (configOrder config)

getLine' :: Config -> IO String
getLine' config = 
    applyLineLimit (configLineLimit config) <$> getLine

getAndArrange' :: Config -> IO [String]
getAndArrange' = runReaderIO (ReaderIO (\env -> pure (arrange' env)) <*> ReaderIO getLine' <*> ReaderIO getLine')

_ = getAndArrange' (Config Forward NoLimit)
_ = getAndArrange' (Config Reverse (MaxLength 3))
