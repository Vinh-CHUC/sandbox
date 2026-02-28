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
-- 1 for precedence
notation:1 "ℕ" => Nat
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

--------------------------------------------
-- 9.2 Functions Predicates and Relations --
--------------------------------------------
