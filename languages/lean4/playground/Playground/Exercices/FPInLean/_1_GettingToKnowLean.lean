/- 1.1 Evaluating Expressions -/
#eval 42 + 19
#eval String.append "A" (String.append "B" "C")
#eval String.append (String.append "A" "B") "C"
#eval if 3 == 3 then 5 else 7
#eval if 3 == 4 then "equal" else "not equal"


/- 1.2 , Types -/
#eval (1 + 2: Nat)
#eval (1 - 5: Nat)  /- Returns 0!! -/
/- #check String.append ["hello", ""] "yo" -/

/- 1.3 Functions and Definitions -/
def hellothere := "hello"
def lean: String := "Lean"
#eval String.append hellothere (String.append " " lean)

def add1 (n: Nat) : Nat := n + 1
#eval add1 5

def maximum (m: Nat) (n: Nat) :=
  if m > n then
    m
  else n
#check maximum
#check (maximum)

/- Left it at 1.3.1.1 -/
def joinStringsWith (a: String) (b: String) (c: String) : String :=
  String.append (String.append b a) c

#check joinStringsWith
#check (joinStringsWith)
#eval joinStringsWith "-" "vinh" "chuc"

def Ten: Nat := 10
def NN: Type := Nat
/- Will attempt to coerce from Nat to NN ?-/
/- def Ten2: NN := 10 -/
/- Works as there is no cercion needed -/
def Ten3: NN := (10: Nat)
#eval Ten3

/- Concept of #unfolding ?? -/
/- Type definitions aren't always unfolded/reduced -/

/- More like a normal alias -/
abbrev NatN := Nat
def Ten4: NatN := 10
#eval Ten4

/- ------------------------------------------------ -/
/- 1.4 Structures, can't be reduced to another type -/
/- ------------------------------------------------ -/
structure Point where
  x: Float
  y: Float
deriving Repr

def origin : Point := {x := 0, y:= 0}
#eval origin
#eval origin.x
#check origin.x

def addPoints (p1: Point) (p2: Point) : Point :=
  {x := p1.x + p2.x, y:= p1.y + p2.y}
def distance (p1: Point) (p2: Point): Float :=
  Float.sqrt (((p2.x - p1.x)^2) + ((p2.y - p1.y)^2))
def p1: Point := {x := 1, y := 2}
def p2: Point := {x := 5, y := -1}
#eval distance p1 p2

/- Have to specify the type -/
#check ({x := 0, y:= 0}: Point)
def zeroX(p: Point): Point :=
  {p with x := 0}
#eval (zeroX {x := 1, y:= 2})

/- 1.4.2 Behind the scenes -/
#eval p1.x == (Point.x p1)
#eval "one string".append "and another"

/- 1.4.3 Exercises -/
structure RectangularPrism where
  height: Float
  width: Float
  depth: Float
deriving Repr

def volume (p: RectangularPrism) : Float :=
  p.height * p.width * p.depth

#check RectangularPrism
#eval volume {height := 2, width := 2, depth := 2}

/- -------------------------- -/
/- 1.5 Datatypes and Patterns -/
/- -------------------------- -/

/- In a way constructors in Lean4 are more like -/ 
/- discriminated unions or variants -/
/- rather than constructors in the OO sense -/
def isZero(n: Nat): Bool :=
  match n with
  | Nat.zero => true
  | Nat.succ k => false
def xy_prod(p: Point): Float :=
  match p with
  | { x := a, y:= b} => a * b
#eval xy_prod {x := 6, y := 7}

/- 1.5.2 Recursive functions -/
/- Simple case of plus => Lean can show that it terminates -/
/- As the recursive call takes a constructor arg (after pattern -/ 
/- matching) so there is strictly decreasing term size, -/
/- with base case -/

/- ---------------- -/
/- 1.6 Polymorphism -/
/- ---------------- -/
structure PPoint (α: Type) where
  x: α
  y: α
deriving Repr

def natOrigin: PPoint Nat := {x := 0, y:= 0}
def floatOrigin: PPoint Float := {x := 0, y:= 0}
#eval natOrigin

def replaceX (α: Type) (point: PPoint α) (newX: α) : PPoint α :=
  {point with x := newX}
def replaceXNat := replaceX Nat
#eval replaceX Nat natOrigin 1
#eval replaceXNat natOrigin 1
/- #eval natOrigin == floatOrigin -/


/- Magic!The type depends on the runtime argument value -/
inductive Sign where
  | pos
  | neg
def posOrNegThree (s: Sign):
    match s with | Sign.pos => Nat | Sign.neg => Int :=
  match s with
  | Sign.pos => (3: Nat)
  | Sign.neg => (-3: Int)
#check posOrNegThree
#check (posOrNegThree)
#eval posOrNegThree Sign.pos
#eval posOrNegThree Sign.neg

/- 1.6.1 LinkedLists -/
