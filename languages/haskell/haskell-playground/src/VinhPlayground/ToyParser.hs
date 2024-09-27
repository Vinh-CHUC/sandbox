{-# LANGUAGE LambdaCase #-}

module VinhPlayground.ToyParser (
  char,
  Error(..),
  Parser(..),
  satisfy
)
where

import Control.Applicative()
import Data.List ()

data Error i e
  = EndOfInput
  | Unexpected i
  | CustomError e
  | Empty
  deriving (Eq, Show)

newtype Parser i e a = Parser
  { runParser :: [i] -> Either [Error i e] (a, [i])
  }


instance Functor (Parser i e) where
  fmap f (Parser runp) = Parser $ \input ->
    case runp input of
      Left errs -> Left errs
      Right (a, rest) -> Right (f a, rest)
  
satisfy :: (i -> Bool) -> Parser i e i
satisfy predicate = Parser $ \case
    [] -> Left [EndOfInput]
    x: xs
      | predicate x -> Right (x, xs)
      | otherwise -> Left [Unexpected x]

char :: Eq i => i -> Parser i e i
char i = satisfy (== i)
