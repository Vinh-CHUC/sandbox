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
import qualified Text.Megaparsec.Char.Lexer as L 

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
  | SDouble Double
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
  lexeme $
  choice
    [ SBool <$> bool,
      SDouble <$> try double,
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
sexp = label "S-expression" $ between (lexeme (char '(')) (char ')')  ((,) <$> atom <*> many atom)
-- Or:
-- sexp = label "S-expression" $ char '(' *> ((,) <$> atom <*> many atom) <* char ')'

double :: Parser Double
double = label "double" $ lexeme $ read <$> do
  left <- some numberChar
  rightM <- optional $ do
    _ <- char '.'
    some numberChar
  _ <- char' 'f'
  pure $ case rightM of
    Nothing -> left
    Just right -> left ++ "." ++ right

numeric :: Parser SExp
numeric = label "number" $ lexeme $ do
  left <- some numberChar
  rightM <- optional $ choice
    [ 
      do
        _ <- char '.'
        right <- some numberChar
        _ <- char' 'f'
        pure $ left ++ "." ++ right
      , do
        _ <- char' 'f'
        pure left
    ]
  pure $ case rightM of
    Nothing -> SInteger $ read left
    Just right -> SDouble $ read right


skipSpace:: Parser ()
skipSpace = L.space
  space1
  (L.skipLineComment ";;")
  (L.skipBlockCommentNested "/*" "*/")

lexeme :: Parser a -> Parser a
lexeme = L.lexeme skipSpace

parseSExp :: String -> Either String SExp
parseSExp input =
  let
    outputE = parse
      (between skipSpace eof atom)
      ""
      input
  in
  case outputE of
    Left err -> Left $ errorBundlePretty err
    Right output -> Right output
