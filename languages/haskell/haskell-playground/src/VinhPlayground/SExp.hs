module VinhPlayground.SExp
  ( atom,
    bool,
    identifier,
    integer,
    sexp,
    SExp (..),
    str,
  )
where

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
      SInteger <$> integer,
      SString <$> str,
      SId <$> identifier,
      uncurry SSExp <$> sexp
    ]

-- Accepts negative numbers
integer :: Parser Integer
integer = label "integer" $ read <$> (some numberChar <|> ((:) <$> char '-' <*> some numberChar))

str :: Parser String
str = label "string" $ between (char '"') (char '"') (takeWhileP Nothing (/= '"'))
-- Or:
--- str = label "string" $ char '"' <* (takewhileP Nothing (/= '"')) *> char '"'

identifier :: Parser Identifier
identifier = label "identifier" $ do
  first <- letterChar <|> char '_'
  rest <- many $ alphaNumChar <|> char '_'
  pure $ Identifier $ first : rest
-- Or:
-- identifier = Identifier <$> label "identifier" ((:) <$> (letterChar <|> char '_') <*> many (alphaNumChar <|> char '_'))

-- Naive way
sexp :: Parser (SExp, [SExp])
sexp = label "S-expression" $ between (char '(') (char ')')  ((,) <$> atom <*> many atom)
-- Or:
-- sexp = label "S-expression" $ char '(' *> ((,) <$> atom <*> many atom) <* char ')'
