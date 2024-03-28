module UserDefinedTypes_2

import Data.Vect

tryIndex : {n: _} -> Integer -> Vect n a -> Maybe a
tryIndex i xs = case integerToFin i n of
                  Nothing => Nothing
                  Just idx => Just $ index idx xs
