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

rectangle : Picture
rectangle = Primitive (Rectangle 20 10)

circle : Picture
circle = Primitive (Circle 5)

triangle : Picture
triangle = Primitive (Triangle 10 10)

testPicture : Picture
testPicture = Combine
                  (Translate 5 5 rectangle)
                  (Combine
                    (Translate 35 5 circle)
                    (Translate 15 25 triangle)
                  )

pictureArea : Picture -> Double
pictureArea (Primitive shape) = area shape
pictureArea (Combine x y) = pictureArea x + pictureArea y
pictureArea (Rotate dbl x) = pictureArea x
pictureArea (Translate dbl dbl1 x) = pictureArea x

-------------------
-- Generic types --
-------------------
data Biggest = NoTriangle | Size Double

biggest_helper : Biggest -> Biggest -> Biggest
biggest_helper NoTriangle NoTriangle = NoTriangle
biggest_helper NoTriangle (Size dbl) = Size dbl
biggest_helper (Size dbl) NoTriangle = Size dbl
biggest_helper (Size dbl) (Size dbl1) = Size $ max dbl dbl1

biggestTriangle : Picture -> Biggest
biggestTriangle (Primitive t@(Triangle dbl dbl1)) = Size $ area t
biggestTriangle (Primitive (Rectangle dbl dbl1)) = NoTriangle
biggestTriangle (Primitive (Circle dbl)) = NoTriangle
biggestTriangle (Combine x y) = (biggest_helper (biggestTriangle x) (biggestTriangle y))
biggestTriangle (Rotate dbl x) = biggestTriangle x
biggestTriangle (Translate dbl dbl1 x) = biggestTriangle x

data Tree elem = Empty | Node (Tree elem) elem (Tree elem)

insert : Ord elem => elem -> Tree elem -> Tree elem
insert x Empty = Node Empty x Empty
insert x (Node left val right) = if x <= val
                                    then Node (insert x left) val right
                                    else Node left x (insert x right)

data BSTree : Type where
  Empty : Ord elem => BSTree elem
  Node : Ord elem => (left : BSTree elem) -> (val : elem) -> (right : BSTree elem) -> BStree elem
