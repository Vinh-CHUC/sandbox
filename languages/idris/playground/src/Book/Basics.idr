module Book.Basics

import Data.String
import Data.List
import System.REPL

add : Int -> Int -> Int
add x y = x + y

substract : Integer -> Integer -> Integer
substract x y = x - y

--------------
-- Generics --
--------------
identity : ty -> ty
identity x = x

-- Some form of dependent Type
-- The earlier arg defines the type of the subsequent one!
-- the : (ty: Type) -> ty -> ty
-- the ty x = x
--
-- Interesting example
-- the String "hello" works
-- the String  5 --> Can't find implementation

-- Constrained types
double : Num ty => ty -> ty
double x = x + x

twice : (a -> a) -> a -> a
twice f x = f (f x)

-- Let and where
longer : String -> String -> String
longer w1 w2 = 
  let len1 = length w1
      len2 = length w2
  in 
      if len1 > len2 then w1 else w2

-- Example function
average: String -> Double
average str = let numwords = length str_words
                  totalLength = sum (map length str_words)
              in cast totalLength / cast numwords
where
  str_words = words str

-- Interactive program
-- Reminder you need to do :exec main from the repl
main : IO  ()
main = repl "> " reverse
