module UserDefinedTypes

------------------
-- Enumerations --
------------------
-- In way this is the most basic type, made of an enumeration of "atomic" elements
data MyBool = Faux | Vrai

data Direction = North | East | South | West

turnClockwise : Direction -> Direction
turnClockwise North = East
turnClockwise East = South
turnClockwise South = West
turnClockwise West = North

-----------------
-- Union types --
-----------------
-- Interestingly the individual constructors do not have an existence of their own
||| Represents shapes
data Shape =
  ||| A triangle 
  Triangle Double Double
  | ||| A rectangle
  Rectangle Double Double 
  | ||| A circle
  Circle Double

-- A more verbose but more generic/flexible version of the above
-- data Shape : Type where
--   Triangle : Double -> Double -> Shape
--   Rectangle : Double -> Double -> Shape
--   Circle : Double -> Shape


area : Shape -> Double
area (Triangle base height) = 0.5 * base * height
area (Rectangle base height) = base * height
area (Circle radius) = pi * radius * radius

---------------------
-- Recursive types --
---------------------
data EntierNaturel = Z | S EntierNaturel

data Picture = Primitive Shape
             | Combine Picture Picture
             | Rotate Double Picture
             | Translate Double Double Picture
