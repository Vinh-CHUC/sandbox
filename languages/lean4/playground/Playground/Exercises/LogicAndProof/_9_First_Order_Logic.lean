import Mathlib.Data.Nat.Prime.Basic

-- 9.1 Functions Predicates and Relations
-- Axiom programming equivalent: declared but not defined?
-- Deeper:
--  axiom: adds to some kind of global registry?
--  variable: intent is implicit parameters
axiom U : Type

axiom c : U
axiom f : U → U
axiom g : U → U → U
axiom P : U → Prop
axiom R : U → U → Prop

variable (x y: U)

-- Terms
#check c
#check f c
#check g x y
#check g x (f c)

-- Formulas, something that can be True False
#check P (g x (f c))
#check R x y

-- Being curious
-- Prop : Type
#check Prop
#check Type
#check Type 1

#check Nat

--
-- Example of Propositions ranging on Nat
--

namespace hidden
/- -- 1 for precedence -/
/- notation:1 "ℕ" => Nat -/
#check ℕ

axiom mul : ℕ → (ℕ → (ℕ))
axiom add : ℕ → (ℕ → (ℕ))
axiom square : Nat → Nat
axiom even : ℕ → Prop
axiom odd : ℕ → Prop
axiom prime : ℕ → Prop
axiom divides : ℕ → (ℕ → Prop)
axiom lt : ℕ → (ℕ → Prop)
axiom zero : ℕ
axiom one : ℕ

variable (w x y z: ℕ)
#check mul x y

-- The priority := has to do with typeclass resolution (~overload)
local infix:65 (priority := high)  " + " => add
local infix:70 (priority := high)  " * " => mul
local infix:50 (priority := high)  " < " => lt

#check even (x + y + z) ∧ prime ((x + one) * y * y)
#check ¬ (square (x + y * z) = w) ∨ x + y < z
#check x < y ∧ even x ∧ even y → x + one < y

end hidden

variable (Point Line : Type)
variable (lies_on : Point → Line → Prop)

#check ∀ (p q : Point) (L M : Line),
        p ≠ q → lies_on p L → lies_on q L → lies_on p M →
          lies_on q M → L = M

----------------------------------------
-- 9.2 Using the Universal Quantifier --
----------------------------------------
#check ∀ x, (Even x ∨ Odd x)∧ ¬ (Even x ∧ Odd x)
#check ∀ x, Even x ↔ 2 ∣ x
#check ∀ x, Even x ↔ Even (x^2)
#check ∀ x, Even x ↔ Odd (x + 1)
#check ∀ x, Prime x ∧ x > 2 → Odd x
#check ∀ x y z, x ∣ y → y ∣ z →  x ∣ z

-- Proving/introducing a universal statement
-- These two are redundant given the axioms at the top?
variable (U : Type)
variable (P : U → Prop)
example : ∀ x, P x := fun x ↦ show P x from sorry

-- Kind of the same as Lambda intro?


-- Elimination rule
-- Note that this is similar to lambda elimination!!!
variable (U : Type)
variable (P : U → Prop)
variable (h: ∀ x, P x)
variable (a: U)

example : P a := show P a from h a

-- Another example
variable (U : Type)
variable (A B : U → Prop)
example (h1 : ∀ x, A x → B x) (h2 : ∀ x, A x) : ∀ x, B x :=
  fun y ↦
  have h3 : A y := h2 y
  have h4 : A y → B y := h1 y
  show B y from h4 h3

example (h1 : ∀ x, A x → B x) (h2 : ∀ x, A x) : ∀ x, B x :=
  fun y ↦
    show B y from h1 y (h2 y)

-- Another example
variable (U : Type)
variable (A B : U → Prop)
example : (∀ x, A x) → (∀ x, B x) → (∀ x, A x ∧ B x) :=
fun hA ↦
  fun hB ↦
    fun y ↦
      have Ay: A y := hA y
      have By: B y := hB y
      show A y ∧ B y from And.intro Ay By

example : (∀ x, A x) → (∀ x, B x) → (∀ x, A x ∧ B x) :=
fun hA ↦
  fun hB ↦
    fun y ↦
      have Ay: A y := hA y
      have By: B y := hB y
      show A y ∧ B y from ⟨‹A y›, ‹B y›⟩

------------------------------------------
-- 9.3 Using the Existential Quantifier --
------------------------------------------
variable (U : Type)
variable (P : U → Prop)

-- Introduction
-- Notice the very explicit link between y and P y!!
example (y : U) (h : P y) : ∃ x, P x :=
  Exists.intro y h

-- Elimination
variable (U : Type)
variable (P : U → Prop)
variable (Q : Prop)

-- If one remembers the ".. should not be free in B or any uncancelled hypothesis"
-- Here it's about the type Q not depending on x?
example (h1 : ∃ x, P x) (h2 : ∀ x, P x → Q) : Q :=
Exists.elim h1
  (fun (y : U) (h : P y) ↦
  show Q from h2 y h)

-- Example --
variable (U : Type)
variable (A B : U → Prop)

example : (∃ x, A x ∧ B x) → ∃ x, A x :=
fun h1 : ∃ x, A x ∧ B x ↦
Exists.elim h1
  (fun y (h2: A y ∧ B y) ↦  
    have h3: A y := And.left h2
    show ∃ x, A x from Exists.intro y h3)

-- Using the $ like in haskell
example : (∃ x, A x ∧ B x) → ∃ x, A x :=
fun h1 : ∃ x, A x ∧ B x ↦
Exists.elim h1 $
  fun y (h2: A y ∧ B y) ↦  
    have h3: A y := And.left h2
    -- Some kind of anonymous ctor a bit like C++'s {...}
    show ∃ x, A x from ⟨y, h3⟩

#check Exists.intro
