module Basics

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
