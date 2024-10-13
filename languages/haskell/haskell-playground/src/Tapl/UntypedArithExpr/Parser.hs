module Tapl.UntypedArithExpr.Parser 
  (
    atom,
    If(..),
    Value(..),
    Term(..)
  )
where

import Data.Void (Void)
import Text.Megaparsec
import Text.Megaparsec.Char
import qualified Text.Megaparsec.Char.Lexer as L 

type Parser =
  Parsec
    Void
    String

--------------------
-- Values & Terms --
--------------------
data Value
  = VTrue 
  | VFalse
  | VZero
  deriving (Eq, Show)

data If = If
  { icond :: Term,
    ithen :: Term,
    ielse :: Term
  }
  deriving (Eq, Show)

data Term
  = TValue Value
  | TIf If
  | Succ Term
  | Pred Term
  | IsZero Term
  deriving (Eq, Show)

-- Misc
skipSpace:: Parser ()
skipSpace = L.space
  space1
  (L.skipLineComment ";;")
  (L.skipBlockCommentNested "/*" "*/")

lexeme :: Parser a -> Parser a
lexeme = L.lexeme skipSpace

-- Parsers
value :: Parser Value
value = VFalse <$ string "false" <|> VTrue <$ string "true" <|> VZero <$ char '0'

tif :: Parser If
tif = If
  <$> lexeme (lexeme (string "if") *> atom)
  <*> lexeme (lexeme (string "then") *> atom)
  <*> lexeme (lexeme (string "else") *> atom)

fn :: String -> Parser Term
fn fn_name = lexeme (string fn_name) *> atom
    

atom :: Parser Term
atom =
  lexeme $
  choice
    [
      TValue <$> value,
      TIf <$> tif,
      Succ <$> fn "succ",
      Pred <$> fn "pred",
      IsZero <$> fn "iszero"
    ]
