module VinhPlayground.SExp
  ( atom,
    bool,
    integer,
    integer2,
    SExp (..),
  )
where

import Control.Exception (SomeException (SomeException))
import Data.Void (Void)
import Text.Megaparsec
import Text.Megaparsec.Char

newtype Identifier = Identifier
  { getId :: String
  }
  deriving (Show)

data SExp
  = SSExp SExp [SExp]
  | SInteger Integer
  | SString String
  | SBool Bool
  | SId Identifier
  deriving (Show)

type Parser =
  Parsec
    Void
    String

-- Reminder "False <$" is the fmap that maps const False :)
bool :: Parser Bool
bool = False <$ string "false" <|> True <$ string "true"

-- choice is provided by megaparsec and relies on alternative typeclass
atom :: Parser SExp
atom =
  choice
    [ SBool <$> bool,
      SInteger <$> integer
    ]

integer :: Parser Integer
integer = label "integer" $ read <$> some numberChar

-- Accepts negative numbers
integer2 :: Parser Integer
integer2 = label "integer" $ read <$> (some numberChar <|> ((:) <$> char '-' <*> some numberChar))
