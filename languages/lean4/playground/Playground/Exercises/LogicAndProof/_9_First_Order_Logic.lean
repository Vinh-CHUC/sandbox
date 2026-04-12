import Mathlib.Data.Nat.Prime.Basic
import Mathlib.Data.Int.Lemmas

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
-- Here P is a dependent type, it is indexed by a
-- **value**
--
-- You can't have Exists.intro take a (P y) alone, otherwise y would be a free variable, it has
-- to be fixed
-- And that would be closer to a universal quantifier!
example (y : U) (h : P y) : ∃ x, P x :=
  Exists.intro y h

-- Elimination
variable (U : Type)
variable (P : U → Prop)
variable (Q : Prop)

-- If one remembers the ".. should not be free in B or any uncancelled hypothesis"
-- Here it's about the type Q not depending on x
--
-- As a reminder we cannot depend on x as we don't know which one it is. Similarly to above that
-- would get us to some kind of universal quantifier
example (h1 : ∃ x, P x) (h2 : ∀ x, P x → Q) : Q :=
Exists.elim h1
  (fun (y : U) (h : P y) ↦
  show Q from h2 y h)

-- Example --
variable (U : Type)
variable (A B : U → Prop)

-- Interestingly here introducing another exists
-- In the elim "hides" our dependence on the exact witness
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

-------------------------
-- Example 2 variant a --
-------------------------
example: (∃ x, A x ∨ B x) → (∃ x, A x) ∨ (∃ x, B x) :=
  fun h1: ∃ x, A x ∨ B x ↦
  Exists.elim h1 $
    fun y (h2: A y ∨ B y) ↦
      Or.elim h2
        (fun h3 : A y ↦
          have h4: ∃ x, A x := Exists.intro y h3
          show (∃ x, A x) ∨ (∃ x, B x) from Or.inl h4)
        (fun h3 : B y ↦
          have h4: ∃ x, B x := Exists.intro y h3
          show (∃ x, A x) ∨ (∃ x, B x) from Or.inr h4)


-- Example 2 variant b --
example: (∃ x, A x ∨ B x) → (∃ x, A x) ∨ (∃ x, B x) :=
  fun h1: ∃ x, A x ∨ B x ↦
  Exists.elim h1 $
    fun y (h2: A y ∨ B y) ↦
      Or.elim h2
        (fun (_ : A y) ↦
          have h4: ∃ x, A x := ⟨y, ‹A y›⟩
          show (∃ x, A x) ∨ (∃ x, B x) from Or.inl h4)
        (fun (_ : B y) ↦
          have h4: ∃ x, B x := ⟨y, ‹B y›⟩
          show (∃ x, A x) ∨ (∃ x, B x) from Or.inr h4)

---------------
-- Example 3 --
---------------
variable (U : Type)
variable (A B : U → Prop)

example: (∀ x, A x → ¬ B x) → ¬ ∃ x, A x ∧ B x :=
  fun h1: ∀ x, A x → ¬ B x ↦
  fun h2: ∃ x, A x ∧ B x ↦
  Exists.elim h2 $
    fun x (h3: A x ∧ B x) ↦
      have h4: A x := And.left h3
      have h5: B x := And.right h3
      show False from (h1 x h4) h5

---------------
-- Example 4 --
---------------
variable (U : Type)
variable (u : U)
variable (P : Prop)

-- A bit weird
-- Lean does not assume that types are necessarily
-- inhabited. So the proof depends on u: U
example : (∃ x: U, P) ↔ P :=
  Iff.intro
    (fun h1 : ∃ x, P ↦
      Exists.elim h1 $
      fun x (h2: P) ↦ h2)
    (fun h1 : P ↦ ⟨u, h1⟩)

------------------
-- 9.4 Equality --
------------------

variable (A: Type)

variable (x y z: A)
variable (P : A → Prop)

example: x = x := show x = x from Eq.refl x

example: y = x :=
  have h: x = y := sorry
  show y = x from Eq.symm h

example: x = z :=
  have h1: x = y := sorry
  have h2: y = z := sorry
  show x = z from Eq.trans h1 h2

example: P y :=
  have h1: x = y := sorry
  have h2: P x := sorry
  show P y from Eq.subst h1 h2

-- Example 1, variant A --
variable (A : Type) (x y z : A)

example: y = x → y = z → x = z :=
  fun h1 h2 ↦ Eq.trans (Eq.symm h1) h2

---------------------
-- 9.5 Tactic Mode --
---------------------

---------------------------------
-- 9.5.1 Universal Quantifiers --
variable (U : Type)
variable (A B : U → Prop)

-- We can use intro and apply as one would expect
example (h1: ∀ x, A x → B x) (h2: ∀ x, A x) : ∀ x, B x := by
  intro
  have a := by apply h2 ‹U›
  exact h1 ‹U› a

-----------------------------------
-- 9.5.2 Existential Quantifiers --
example : (∃ x, A x ∧ B x) → ∃ x, A x := by
  intro (h1: ∃ x, A x ∧ B x)
  cases h1 with
  -- Note the very interesting duality here, the constructor mirrors the elim rule?
  | intro y h2 =>
    show ∃ x, A x
    apply Exists.intro y
    show A y
    cases h2 with
    | intro h3 _ =>
      exact h3

example : (∃ x, A x ∨ B x) → (∃ x, A x) ∨ (∃ x, B x) := by
  intro (h1: ∃ x, A x ∨ B x)
  cases h1 with
  | intro y h2 =>
    cases h2 with
    | inl h3 =>
      apply Or.inl
      apply Exists.intro y
      -- Could have used assumption
      exact ‹A y›
    | inr h4 =>
      apply Or.inr
      apply Exists.intro y
      assumption


-- Same as above but using a mixture of tactic and
example : (∃ x, A x ∨ B x) → (∃ x, A x) ∨ (∃ x, B x) := by
  intro (h1 : ∃ x, A x ∨ B x)
  cases h1 with
  | intro y h2 =>
    cases h2 with
    | inl h3 => exact Or.inl (Exists.intro y h3)
    | inr h3 => exact Or.inr (Exists.intro y h3)

-- Same as above but using the obtain tactic
example : (∃ x, A x ∨ B x) → (∃ x, A x) ∨ (∃ x, B x) := by
  intro (h1 : ∃ x, A x ∨ B x)
  obtain ⟨y, (h2: A y ∨ B y)⟩ := h1
  obtain (h3: A y) | (h4: B y) := h2
  . exact Or.inl (Exists.intro y h3)
  . exact Or.inr (Exists.intro y h4)

--------------------
-- 9.5.3 Equality --

-- Term mode
example : y = x → y = z → x = z :=
  fun h1 h2 ↦ Eq.trans (Eq.symm h1) h2

-- Equivalent in tactic mode
example : y = x → y = z → x = z := by
  intro (hyx: y = x) (hyz: y = z)
  -- At this point the goal is x = z
  rewrite [← hyx]
  -- Rewrite performs a substitution
  -- y = x, with the <- arrow x = y
  -- Subtitude x for y in the goal
  --
  -- And now it's y = z!!!
  --
  -- It's a consequence that transitivity is a consequence of substitution!
  exact hyz

example : y = x → y = z → x = z := by
  intro (hyx : y = x) (hyz : y = z)
  rw [←hyx]
  -- This turns the goal into z = z, and automatically applies reflexivity
  -- A bit convoluted?
  rw [hyz]

variable (A B : Prop)

-- Works as well with equivalence of propositions
example (hAC : A ↔ C) (hCB : C ∧ B) : A ∧ B := by
  -- Note that it wouldn't work with A → C!!
  rw [hAC]
  exact hCB

------------------------------
-- 9.6 Calculational Proofs --
------------------------------

-- The idea: formalise a typical sequence of equality
example: y = x → y = z → x = z :=
  fun h1 : y = x ↦
  fun h2 : y = z ↦
  calc
    x = y := Eq.symm h1
    _ = z := h2

#check Int.add_zero

variable (x y z: Int)

example : x + 0 = x :=
Int.add_zero x

example : 0 + x = x :=
Int.zero_add x

example : (x + y) + z = x + (y + z) :=
Int.add_assoc x y z

example : x + y = y + x :=
Int.add_comm x y

example : (x * y) * z = x * (y * z) :=
Int.mul_assoc x y z

example : x * y = y * x :=
Int.mul_comm x y

example : x * (y + z) = x * y + x * z :=
Int.mul_add x y z

example : (x + y) * z = x * z + y * z :=
Int.add_mul x y z

-- Example 1 - Variant A --
example (x y z : Int) : (x + y) + z = (x + z) + y :=
calc
  (x + y) + z = x + (y + z) := Int.add_assoc x y z
  -- the @ symbol is about forcing all parameters to be explicitly provided
  -- α
  -- α → Prop
  -- a: Inferred to be y + z
  -- b: Inferred to be z + y
  -- a = b
  -- P a
  --
  -- We get P b
  _ = x + (z + y) := @Eq.subst _ (λ w ↦ x + (y + z) = x + w) _ _ (Int.add_comm y z) rfl
  -- Eq.symm as the assoc isn't written in the canonical direction
  _ = (x + z) + y := Eq.symm (Int.add_assoc x z y)

-- Example 1 - Variant B --
example (x y z : Int) : (x + y) + z = (x + z) + y :=
calc
  (x + y) + z = x + (y + z) := by rw [Int.add_assoc]
  _ = x + (z + y) := by rw [Int.add_comm y z]
  _ = (x + z) + y := by rw [Int.add_assoc]

-- Example 1 - Variant C --
example (x y z : Int) : (x + y) + z = (x + z) + y := by
  rw [Int.add_assoc, Int.add_comm y z, Int.add_assoc]

-- Example 2 -
variable (a b d c : Int)

example : (a + b) * (c + d) = a * c + b * c + a * d + b * d :=
calc
  (a + b) * (c + d) = (a + b) * c + (a + b) * d := by rw [Int.mul_add]
    _ = (a * c + b * c) + (a + b) * d         := by rw [Int.add_mul]
    _ = (a * c + b * c) + (a * d + b * d)     := by rw [Int.add_mul]
    -- In more details
    -- add_assoc means a + b + c = a + (b + c)
    --
    -- + is left associative by default, so it's really
    -- (a + b) + c = a + (b + c)
    _ = a * c + b * c + a * d + b * d         := by rw [←Int.add_assoc]


-- Example 2 - Variant B -
example : (a + b) * (c + d) = a * c + b * c + a * d + b * d := by
  rw [Int.mul_add, Int.add_mul, Int.add_mul, ← Int.add_assoc]

-------------------
-- 9.7 Exercises --
-------------------

-- 1 -
section
  variable (A: Type)
  variable (f: A → A)
  variable (P: A → Prop)
  variable (h: ∀ x, P x → P (f x))

  example: ∀ y, P y → P (f (f y)) := by
  intro (y: A) (py: P y) -- P (f (f y))
  apply h -- P (f y)
  apply h -- P y
  exact py

  -- Term version
  example: ∀ y, P y → P (f (f y)) :=
  fun (y: A) (py: P y) ↦ (
    show P (f (f y)) from
    have pfy: P (f y) := h y py
    have pffy: P (f (f y)) := h (f y) (pfy)
    pffy
  )
end

-- 2 -
section
  variable (U: Type)
  variable (A B: U → Prop)

  example : (∀ x, A x ∧ B x) → ∀ x, A x := by
  intro x_a_and_b x
  exact And.left $ x_a_and_b x

  -- Term version
  example : (∀ x, A x ∧ B x) → ∀ x, A x :=
  fun (x_a_and_b: ∀ x, A x ∧ B x) ↦
    fun (x: U) ↦
      And.left $ x_a_and_b x
end

-- 3 -
section
  variable (U: Type)
  variable (A B C: U → Prop)

  variable (h1: ∀ x, A x ∨ B x)
  variable (h2: ∀ x, A x → C x)
  variable (h3: ∀ x, B x → C x)

  example : ∀ x, C x := by
    intro
    apply Or.elim $ h1 ‹U›
    . show A ‹U› → C ‹U›
      intro
      exact h2 ‹U›  ‹A ‹U››
    . show B ‹U› → C ‹U›
      intro
      exact h3 ‹U›  ‹B ‹U››

  -- Term version
  example : ∀ x, C x :=
    fun (x: U) ↦
      match h1 x with
      | Or.inl ax => h2 x ax
      | Or.inr bx => h3 x bx
end

-- 4 -
section
  open Classical   -- not needed, but you can use it

  -- This is an exercise from Chapter 4. Use it as an axiom here.
  axiom not_iff_not_self (P : Prop) : ¬ (P ↔ ¬ P)

  example (Q : Prop) : ¬ (Q ↔ ¬ Q) := not_iff_not_self Q

  variable (Person : Type)
  variable (shaves : Person → Person → Prop)
  variable (barber : Person)
  variable (h : ∀ x, shaves barber x ↔ ¬ shaves x x)

  example : False := by
    have a : shaves barber barber ↔ ¬ shaves barber barber := h barber
    -- Do not use the ‹shaves barber barber› here!
    exact not_iff_not_self (shaves barber barber) a

  -- Term variant
  example : False :=
    have a : shaves barber barber ↔ ¬ shaves barber barber := h barber
    not_iff_not_self (shaves barber barber) a

  example : False := by
    apply Or.elim $ Classical.em $ shaves barber barber
    . intro
      have b_doesnot_shave_himself: ¬ shaves barber barber := by
        apply Iff.mp (h barber)
        exact ‹shaves barber barber›
      contradiction
    . intro
      have b_does_shave_himself: shaves barber barber := by
        apply Iff.mpr (h barber)
        exact ‹¬ shaves barber barber›
      contradiction

  -- Term variant
  example : False :=
  Or.elim (Classical.em (shaves barber barber))
  (
    fun (shaves_himself: shaves barber barber) =>
      have b_doesnot_shave_himself: ¬ shaves barber barber := Iff.mp (h barber) shaves_himself
      b_doesnot_shave_himself shaves_himself
  )
  (
    fun (doesnot_shave_himself: ¬ shaves barber barber) =>
      have shaves_himself: shaves barber barber := Iff.mpr (h barber) doesnot_shave_himself
      doesnot_shave_himself shaves_himself
  )

end

-- 5 -
-- ASK ON ZULIP
section
  variable (U : Type)
  variable (A B : U → Prop)

  example : (∃ x, A x) → ∃ x, A x ∨ B x := by
  intro h
  obtain ⟨x, ax⟩ := h
  -- Somehow magically no need to supply x as well
  apply Exists.intro
  . exact Or.inl ax

  example : (∃ x, A x) → ∃ x, A x ∨ B x := by
  intro h
  obtain ⟨x, ax⟩ := h
  apply Exists.intro x
  . exact Or.inl ax

end

---------------
-- ASK ON ZULIP FOR THE ABOVE
---------------

-- 6 -
section
  variable (U: Type)
  variable (A B : U → Prop)

  variable (h1 : ∀ x, A x → B x)
  variable (h2 : ∃ x, A x)

  example : ∃ x, B x := by
  obtain ⟨x, ax⟩ := h2
  exact Exists.intro x $ h1 x ax

  -- Term variant
  example : ∃ x, B x :=
  match h2 with
  | Exists.intro x ax => Exists.intro x $ h1 x ax
end

-- 7 -
section
  variable (U: Type)
  variable (A B C : U → Prop)

  example
    (h1 : ∃ x, A x ∧ B x)
    (h2 : ∀ x, B x → C x)
  : ∃ x, A x ∧ C x := by
  obtain ⟨x, ⟨ax, bx⟩⟩ := h1
  apply Exists.intro
  exact ⟨ax, h2 x bx⟩

  -- Term variant
  example
    (h1 : ∃ x, A x ∧ B x)
    (h2 : ∀ x, B x → C x)
  : ∃ x, A x ∧ C x :=
  match h1 with
  | Exists.intro x ⟨ax, bx⟩ =>
    Exists.intro x ⟨ax, h2 x bx⟩
end

-- 8 -
section
  variable (U : Type)
  variable (A B C : U → Prop)

  example : (¬ ∃ x, A x) → ∀ x, ¬ A x := by
  intro not_ex_ax x ax
  apply not_ex_ax
  exact Exists.intro x ax

  -- Term variant
  example : (¬ ∃ x, A x) → ∀ x, ¬ A x :=
  fun (not_ex_ax: ¬ ∃ x, A x) (x : U) (ax: A x) ↦
    not_ex_ax $ Exists.intro x ax

  example : (∀ x, ¬ A x) → ¬ ∃ x, A x := by
  intro neg_ax ex_ax
  obtain ⟨x, ax⟩ := ex_ax
  exact neg_ax x ax

  -- Term variant
  example : (∀ x, ¬ A x) → ¬ ∃ x, A x :=
  fun (not_ax) (ex_ax) ↦
    match ex_ax with
    | Exists.intro x ax => not_ax x ax
end

-- 9 -
section
  variable (U : Type)
  variable (R : U → U → Prop)

  example : (∃ x, ∀ y, R x y) → ∀ y, ∃ x, R x y := by
  intro xy_rxy
  obtain ⟨x, y_to_rxy⟩ := xy_rxy
  intro y
  apply Exists.intro
  exact y_to_rxy y

  -- Term variant
  example : (∃ x, ∀ y, R x y) → ∀ y, ∃ x, R x y :=
  fun (exx_y_rxy) (y) ↦
    have ⟨x, y_to_rxy⟩ := exx_y_rxy
    Exists.intro x $ y_to_rxy y
end

-- 10 -
#check rfl

section
  theorem foo {A : Type} {a b c : A} : a = b → c = b → a = c :=
  sorry

  section
    variable (A : Type)
    variable (a b c : A)

    example (h1 : a = b) (h2 : c = b) : a = c :=
    foo h1 h2
  end

  section
    variable {A : Type}
    variable {a b c : A}

    -- replace the sorry with a proof, using foo and rfl, without using eq.symm.
    theorem my_symm (h : b = a) : a = b := by
    -- a = a → b = a
    exact foo (refl a) h

    -- now use foo and my_symm to prove transitivity
    theorem my_trans (h1 : a = b) (h2 : b = c) : a = c := by
    exact foo h1 (my_symm h2)
  end
end

-- 11 -
section
#check @add_assoc
#check @add_comm
#check @add_zero
#check @zero_add
#check @mul_assoc
#check @mul_comm
#check @mul_one
#check @one_mul
#check @left_distrib
#check @right_distrib
#check @Int.add_left_neg
#check @Int.add_right_neg
#check @sub_eq_add_neg

variable (x y z : Int)

theorem t1 : x - x = 0 :=
  calc
  x - x = x + -x := by rw [sub_eq_add_neg]
  _ = 0 := by rw [Int.add_right_neg]

theorem t2 (h : x + y = x + z) : y = z :=
  calc
  y = 0 + y := by rw [zero_add]
  _ = (-x + x) + y := by rw [Int.add_left_neg]
  _ = -x + (x + y) := by rw [add_assoc]
  _ = -x + (x + z) := by rw [h]
  _ = (-x + x) + z := by rw [add_assoc]
  _ = 0 + z := by rw [Int.add_left_neg]
  _ = z := by rw [zero_add]

theorem t3 (h : x + y = z + y) : x = z :=
  calc
  x = x + 0 := by rw [add_zero]
  _ = x + (y + -y) := by rw [Int.add_right_neg]
  _ = (x + y) + -y := by rw [← add_assoc]
  _ = (z + y) + -y := by rw [h]
  _ = z + (y + -y) := by rw [add_assoc]
  _ = z + 0 := by rw [Int.add_right_neg]
  _ = z := by rw [add_zero]

theorem t4 (h : x + y = 0) : x = -y :=
calc
x = x + 0 := by rw [add_zero]
_ = x + (y + -y) := by rw [Int.add_right_neg]
_ = (x + y) + -y := by rw [← add_assoc]
_ = 0 + -y := by rw [h]
_ = -y := by rw [zero_add]

theorem t5 : x * 0 = 0 :=
have h1 : x * 0 + x * 0 = x * 0 + 0 :=
  calc
    x * 0 + x * 0 = x * (0 + 0) := by rw [← left_distrib]
    _ = x * 0 := by rw [zero_add]
    _ = x * 0 + 0 := by rw [add_zero]
show x * 0 = 0 from t2 _ _ _ h1

theorem t6 : x * (-y) = - (x * y) :=
have h1 : x * (-y) + x * y = 0 :=
  calc
    x * (-y) + x * y = x * (-y + y) := by rw [← left_distrib]
    _ = x * 0 := by rw [Int.add_left_neg]
    _ = 0 := by rw [t5 x]
show x * (-y) = -(x * y) from t4 _ _ h1

theorem t7 : x + x = 2 * x :=
calc
x + x = 1 * x + 1 * x := by rw [one_mul]
_ = (1 + 1) * x := by rw [← right_distrib]
_ = 2 * x := rfl

end

-- 12 -
section

#check Nat
open Nat
#check odd_add
#check odd_mul
#check not_even_iff_odd
#check not_even_one

example : ∀ x y z: ℕ, Odd x → Odd y → Even z → Odd ((x * y) * (z + 1)) := by
  intro x y z oddx oddy evenz
  have : Odd (x * y) := odd_mul.mpr ⟨oddx, oddy⟩
  have : 1 + z = z + 1 := by rw [add_comm]
  have : Odd (1 + z) := by
    apply odd_add.mpr
    apply Iff.intro
    . intro
      assumption
    . intro
      apply not_even_iff_odd.mp
      exact not_even_one
  have odd_sym : Odd (1 + z) ↔ Odd (z + 1) := by rw [‹1 + z = z + 1›]
  apply odd_mul.mpr
  apply And.intro
  . assumption
  . apply odd_sym.mp
    assumption
end
