module Book.InteractiveDev

import Data.Vect

allLengths : List String -> List Nat
allLengths [] = []
allLengths (word :: words) = length word :: allLengths words

mutual
  -- Very inefficient definition...
  isEven : Nat -> Bool
  isEven 0 = True
  isEven (S k) = not $ isEven k

  isOdd : Nat -> Bool
  isOdd 0 = False
  isOdd (S k) = isEven k

theList: List String
theList = the (List _)  ["Hello", "There"]

theVec: Vect 2 String
theVec = the (Vect 2 String) ["Hello", "There"]

total allLenghts2 : Vect len String -> Vect len Nat
allLenghts2 [] = []
allLenghts2 (x :: xs) = length x :: allLenghts2 xs

insert : Ord elem => (x: elem) -> (xsSorted : Vect k elem) -> Vect (S k) elem
insert x [] = [x]
insert x (y :: xs) = if x < y
                     then x :: y :: xs
                     else y :: insert x xs

insSort : Ord elem => Vect n elem -> Vect n elem
insSort [] = []
insSort (x :: xs) = let xsSorted = insSort xs in insert x xsSorted

----------------------
-- Matrix Functions --
----------------------

--
-- Transpose
--

createEmpties: {n: _} -> Vect n (Vect 0 elem)
createEmpties = replicate n []

transposeHelper : (x : Vect n elem) -> (xsTrans: Vect n (Vect k elem)) -> Vect n (Vect (S k) elem)
transposeHelper [] [] = []
transposeHelper (x :: xs) (y :: ys) = (x :: y) :: (transposeHelper xs ys)

transposeMat : {n : _} -> Vect m (Vect n elem) -> Vect n (Vect m elem)
transposeMat [] = createEmpties
-- x: Vect n elem
-- xs: Vect len (Vect n elem)
transposeMat (x :: xs) = let xsTrans = transposeMat xs in (transposeHelper x xsTrans)

transposeMat2 : {n : _} -> Vect m (Vect n elem) -> Vect n (Vect m elem)
transposeMat2 [] = createEmpties
transposeMat2 (x :: xs) = let xsTrans = transposeMat2 xs
                          in 
                            zipWith (\x, y => x :: y) x xsTrans

--
-- Add
--
addMatrix : Num elem => Vect m (Vect n elem) -> Vect m (Vect n elem) -> Vect m (Vect n elem)
addMatrix [] [] = []
addMatrix (x :: xs) (y :: ys) = zipWith (\x, y => x + y) x y :: addMatrix xs ys

--
-- Multiply
--
dotProduct: Num elem => Vect m elem -> Vect m elem -> elem
dotProduct xs ys = sum(zipWith (*) xs ys)

multMatrixHelper : {m: _} -> Num elem => Vect m (Vect n elem) -> Vect o (Vect n elem) -> Vect m (Vect o elem)
multMatrixHelper [] ys = []
multMatrixHelper (x :: xs) yss = (map (dotProduct x) yss) :: multMatrixHelper xs yss

multMatrix: {o, m: _} -> Num elem => Vect m (Vect n elem) -> Vect n (Vect o elem) -> Vect m (Vect o elem)
multMatrix xs ys = let ysTrans = transposeMat2 ys in multMatrixHelper xs ysTrans

------------------------
-- Implicit Arguments --
------------------------
{-
Here we are very explicit about the various types elem, n, m
append Char 2 2 ['a', 'b'] ['c', 'd']
append _    _ _ ..
-}
append : (elem : Type) -> (n : Nat) -> (m: Nat) -> Vect n elem -> Vect m elem -> Vect (n + m) elem
append elem Z m [] ys = ys
append elem (S k) m (x :: xs) ys = x :: append elem k m xs ys

-- Bound and unbound implicities
{-
Recall the {x: S} -> T notation, x is intented to be inferred by Idris
S can be Type or Nat for example
This makes x available to match on? While otherwise it's only for types? Specific to Idris2
 
test : f m a -> b -> a
f is not an unbound implicit, to be unbound implicit you either to be an arg or a standalone
-}
