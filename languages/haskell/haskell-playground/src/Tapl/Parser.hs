{-# LANGUAGE OverloadedStrings #-}
module Tapl.Parser (
    spaceConsumer,
    a,
    b
) where

import Data.Void
import Data.Text (Text)
import Text.Megaparsec
import Text.Megaparsec.Char
import qualified Text.Megaparsec.Char.Lexer as L

type Parser = Parsec Void Text


spaceConsumer :: Parser ()
spaceConsumer = L.space space1 empty empty

a :: IO ()
a = parseTest (satisfy (== 'a') :: Parser Char) "a"

b :: Either (ParseErrorBundle Text Void) Char
b = parse (char 'a' :: Parser Char) "" "a"
