module Main

main : IO ()
main = putStrLn ?greetings

-- :t to check holes
-- e.g. :t greetings
-- main : IO ()
-- main = putStrLn ?greetings

substract : Nat -> Nat -> Nat
substract x y = x - y

StringOrInt : Bool -> Type
StringOrInt x = case x of
					True => Int
					False => String
valToString : (x : Bool) -> StringOrInt x -> String
valToString x val = case x of
						True => ?xtrueType
						False => ?xfalseType
