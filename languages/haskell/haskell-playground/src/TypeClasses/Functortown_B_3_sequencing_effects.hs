{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE DeriveFunctor #-}

module TypeClasses.Functortown_B_3_sequencing_effects (
) where
import Control.Applicative (Applicative (..))
import qualified Data.List as List
import GHC.Natural
import Control.Applicative
import Data.Validation
import Text.Read
import Data.Text (strip)
import Test.Hspec (xit)
import Control.Lens (use)

-- (*>) :: f a -> f b -> f b
-- (<*) :: f a -> f b -> f a

-- Revisiting the Validation package
-- 
-- Validation is ~"Either with Semigroup constraint on the error value"
-- Notice that
--
-- Failure "Err1" *> Failure "Err2" returns Failure "Err1 Err2"
-- and does not short circuit!!!

-- A philosophical point
--
-- This following cannot be expressed entirely in the applicative style
-- As there is a function of the type a -> m b
--
-- validatePassword :: Password -> Validation Error Password
-- validatePassword (Password password) =
--   case (stripSpace password) of
--     Failure err -> Failure err
--     Success password' ->
--       allAlpha password' *> passwordLength password'

-- Discarding results
readNumber s =
    case readMaybe @Natural s of
        Nothing -> Failure ["Not a number"]
        Just n -> Success not

checkLength s =
    case (length s > 5) of
        True -> Failure ["Too long"]
        False -> Success s

-- readNumber is only used for its effect
check s = readNumber s *> checkLength s

-------------
-- Parsing --
-------------

newtype Parser a = Parser (String -> Maybe (String, a)) deriving Functor

instance Applicative Parser where
    pure x = Parser (\str -> Just (str, x))
    liftA2 = parserLiftA2

parserLiftA2 :: (a -> b -> c) -> Parser a -> Parser b -> Parser c
parserLiftA2 f (Parser p1) (Parser p2) =
    Parser $ \str ->
        do
            -- x, y what has been matched, for "(" and ")" we want to throw them away hence the use
            -- of *> and <* further below. Only the last parser will return what it consumed, the
            -- n-1 first ones are just here the remove the "bits we don't want"
            (str', x) <- p1 str  -- e.g. str': "abc)" x: "("
            (str'', y) <- p2 str'
            Just (str'', f x y)  -- In applicative style (f x) = id !!!

parseMaybe :: Parser a -> String -> Maybe a
parseMaybe (Parser p) str =
    case p str of
        Just ([], x) -> Just x
        Just _ -> Nothing -- We want to read the entire input, we fall here in String != [], so err
        Nothing -> Nothing

exact :: String -> Parser String
exact x = Parser $ \str ->
    case (List.stripPrefix x str) of
        Just str' -> Just (str', x)
        Nothing -> Nothing

anythingBut :: Char -> Parser String
anythingBut c = Parser $ \str ->
    let (match, remainder) = List.span (/= c) str
    in Just (remainder, match)

parenParser = exact "(" *> anythingBut ')' <* exact ")"

liftA3 :: Applicative f => (a -> b -> c -> d) -> f a -> f b -> f c -> f d
liftA3 f as bs cs = f <$> as <*> bs <*> cs
liftA3 f as bs cs = liftA2 f as bs <*> cs
