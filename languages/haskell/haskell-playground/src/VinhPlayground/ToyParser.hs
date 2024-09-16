module VinhPlayground.ToyParser
  (
  )
where

import Control.Applicative (Alternative (..))
import Data.List (nub)

data Error i e
  = EndOfInput
  | Unexpected i
  | CustomError e
  | Empty
  deriving (Eq, Show)

newtype Parser i e a = Parser
  { runParser :: [i] -> Either [Error i e] (a, [i])
  }
