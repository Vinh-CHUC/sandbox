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
def hello := "hello"
def lean: String := "Lean"
#eval String.append hello (String.append " " lean)

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
def Ten2: NN := 10
/- Works as there is no cercion needed -/
def Ten3: NN := (10: Nat)
#eval Ten3

/- Concept of #unfolding ?? -/
/- Type definitions aren't always unfolded/reduced -/

/- More like a normal alias -/
abbrev NatN := Nat
def Ten4: NatN := 10
#eval Ten4

/- 1.4 Structures, can't be reduced to another type -/
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
