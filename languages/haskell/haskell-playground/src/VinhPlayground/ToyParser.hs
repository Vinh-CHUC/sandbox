{-# LANGUAGE LambdaCase #-}

module VinhPlayground.ToyParser
  ( char,
    eof,
    Error (..),
    Parser (..),
    satisfy,
    string,
    traverse,
  )
where

import Control.Applicative (Alternative (..))
import Data.List (nub)

data Error i e
  = EndOfInput
  | Unexpected i
  | CustomError e
  | Expected i i
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

instance Applicative (Parser i e) where
  pure a = Parser $ \input -> Right (a, input)
  Parser p <*> Parser q = Parser $ \input ->
    case p input of
      Left errs -> Left errs
      Right (f, rest) ->
        case q rest of
          Left errs -> Left errs
          Right (a, rest') ->
            Right (f a, rest')

instance Monad (Parser i e) where
  return = pure

  Parser p >>= k = Parser $ \input ->
    case p input of
      Left err -> Left err
      Right (output, rest) ->
        let Parser p' = k output
         in p' rest

instance (Eq i, Eq e) => Alternative (Parser i e) where
  empty = Parser $ \_ -> Left [Empty]

  Parser l <|> Parser r = Parser $ \input ->
    case l input of
      Left err ->
        case r input of
          Left err' -> Left $ nub $ err <> err'
          ri@(Right _) -> ri
      ri@(Right _) -> ri

satisfy :: (i -> Bool) -> Parser i e i
satisfy predicate = Parser $ \case
  [] -> Left [EndOfInput]
  x : xs
    | predicate x -> Right (x, xs)
    | otherwise -> Left [Unexpected x]

char :: (Eq i) => i -> Parser i e i
char i = Parser $ \input ->
  let out = runParser (satisfy (== i)) input
   in case out of
        ri@(Right _) -> ri
        Left [Unexpected un] -> Left [Expected i un]
        x -> x

string :: (Eq i) => [i] -> Parser i e [i]
string = traverse char

eof :: Parser i e ()
eof = Parser $ \case
  [] -> Right ((), [])
  x : _ -> Left [Unexpected x]
