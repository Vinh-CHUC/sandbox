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
insert x orig@(Node left val right) =
  case compare x val of
    LT => Node (insert x left) val right
    EQ => orig
    GT => Node left val (insert x right)

data BSTree : Type -> Type where
    BSEmpty : Ord elem => BSTree elem
    BSNode : Ord elem => (left : BSTree elem) -> (val : elem) -> (right : BSTree elem) -> BSTree elem

BSinsert : elem -> BSTree elem -> BSTree elem
BSinsert x BSEmpty = BSNode BSEmpty x BSEmpty
BSinsert x orig@(BSNode left val right) =
  case compare x val of 
    LT => BSNode (BSinsert x left) val right
    EQ => orig
    GT => BSNode left val (BSinsert x right)

-- Exercises
listToTree : Ord a => List a -> Tree a
listToTree [] = Empty
listToTree (x :: xs) = insert x $ listToTree xs

treeToList : Tree a -> List a
treeToList Empty = []
treeToList (Node left val right) = treeToList left ++ [val] ++ treeToList right

data Expr : Type -> Type where
  Atom : Num a => (val : a) -> Expr a
  Add : Num a => (left : Expr a) -> (right : Expr a) -> Expr a
  Mult : Num a => (left : Expr a) -> (right : Expr a) -> Expr a

evaluate : Expr a -> a
evaluate (Atom val) = val
evaluate (Add left right) = evaluate left + evaluate right
evaluate (Mult left right) = evaluate left * evaluate right

--------------------------
-- Dependent data types --
--------------------------

data PowerSource = Petrol | Pedal

-- This is a type that is dependent on PowerSource **values**, Petrol and Pedal are values!!!
-- There are effectively 2 types in this declaration
data Vehicle : PowerSource -> Type where
  Bicycle : Vehicle Pedal
  Car : (fuel : Nat) -> Vehicle Petrol
  Bus : (fuel : Nat) -> Vehicle Petrol

-- Using a type variable, as this works for all types
wheels: Vehicle power -> Nat
wheels Bicycle = 2
wheels (Car fuel) = 4
wheels (Bus fuel) = 4

-- Restricing on `Petrol` here effectively restricts the subset of the "type family" that this
-- fnuction can operate on
refuel: Vehicle Petrol -> Vehicle Petrol
refuel (Car fuel) = Car 100
refuel (Bus fuel) = Bus 200
refuel Bicycle impossible

-- -- Vect example
data Vect : Nat -> Type -> Type where
  Nil : Vect Z a
  (::) : (x : a) -> (xs: Vect k a) -> Vect (S k) a

%name Vect xs, ys, ys

append: Vect n elem -> Vect m elem -> Vect (n + m) elem
append [] ys = ys
append (x :: xs) ys = x :: append xs ys

zip : Vect n a -> Vect n b -> Vect n (a, b)
zip [] ys = []
zip (x :: xs) (y :: ys) = (x, y) :: zip xs ys
