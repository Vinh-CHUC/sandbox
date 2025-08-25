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
