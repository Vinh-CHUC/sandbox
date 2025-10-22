/- ------------------------------------------- -/
/- 4.1 Expressions for Propositions and Proofs -/
/- ------------------------------------------- -/
variable (A B C: Prop)
#check A ∧ ¬ B → C

variable (h: A ∧ ¬ B)
#check h

/- These two below are effectively the elimination rules for And -/
#check And.left h
#check And.right h

/- Introducing not B and A -/
#check And.intro (And.right h) (And.left h)

/- Implication -/
variable (h1: A → (B → C))
variable (h2: D → A)
variable (h3: D)
variable (h4: B)

#check h2 h3
#check h1 (h2 h3)
#check (h1 (h2 h3)) h4

/- Proof of an implication -/
/- e.g. producing a specific function of a given fn type -/

/- Proof that A -> A and A -/
#check (fun h: A ↦ And.intro h h)
#check (fun h: A => And.intro h h)
#check (λ h: A ∧ ¬ B => And.intro (And.right h) (And.left h))

/- ----------------- -/
/- 4.2 More commands -/
/- ----------------- -/

/- example -/

example : A ∧ ¬ B → ¬ B ∧ A :=
  fun h : A ∧ ¬ B ↦ And.intro (And.right h) (And.left h)

/- Type can be inferred -/
example : A ∧ ¬ B → ¬ B ∧ A :=
  fun h  ↦ And.intro (And.right h) (And.left h)

/- Even more explicit with show -/
example : A ∧ ¬ B → ¬ B ∧ A :=
  fun h : A ∧ ¬ B ↦ show ¬ B ∧ A from And.intro (And.right h) (And.left h)

/- Even more explicit with show -/
example : A ∧ ¬ B → ¬ B ∧ A :=
  fun h : A ∧ ¬ B ↦
    show ¬ B ∧ A from And.intro (show ¬ B from And.right h) (show A from And.left h)

/- sorry -/
/- acts as a placeholder -/

example: A ∧ B → ¬ B ∧ A :=
  fun h ↦ sorry

/- _ -/
/- type hole -/

/- example : A ∧ B → ¬ B ∧ A := -/
/-   fun h : A ∧ B ↦ And.intro _ _ -/

/- ------------------------------------- -/
/- 4.3 Building Natural Deduction Proofs -/
/- ------------------------------------- -/

/- 4.3.1 Implication -/
section
  variable (A B: Prop)

  example: A → B:=
  fun h : A ↦
  show B from sorry

  section
    variable (h1: A → B) (h2 : A)

    example: B := h1 h2
  end
end

/- 4.3.2 Conjunction -/
section 
  variable (h1: A) (h2: B)
  example :A ∧ B := And.intro h1 h2
end

section
  variable (h: A ∧ B)

  example : A := And.left h
  example : B := And.right h
end

/- 4.3.3 Disjunction -/
section
  variable (h: A)
  variable (i: B)
  
  example : A ∨ B := Or.inl h
  example : A ∨ B := Or.inr i
end

section
  variable (h: A ∨ B) (ha: A → C) (hb: B → C)
  example : C :=
  Or.elim h
    (ha)
    (hb)

  example : C :=
  Or.elim h
    (fun h1: A ↦ show C from ha h1)
    (fun h2: B ↦ show C from hb h2)
end

/- 4.3.4 Negation -/
section
  example: ¬ A := fun h : A ↦ show False from sorry
end

section
  variable (h1: ¬ A) (h2 : A)
  example : False := h1 h2
end

/- 4.3.5 Truth and falsity -/
variable (h: False)
example : A := False.elim h
example : True := trivial

/- 4.3.6 Bi-Implication -/
example: A ↔ B :=
  Iff.intro
    (fun h: A ↦ show B from sorry)
    (fun h: B ↦ show A from sorry)

section
  variable (h1: A ↔ B)
  variable (h2: A)

  example : B := Iff.mp h1 h2
end 

section
  variable (h1: A ↔ B)
  variable (h2: B)

  example : A := Iff.mpr h1 h2
end 

/- 4.3.7 Reductio ad absurdum (proof by contradiction) -/
section
  open Classical

  example: A :=
  byContradiction (fun h: ¬ A ↦ show False from sorry)
end 

/- 4.3.8 Examples -/
section
  variable (h1 : A → B)
  variable (h2 : B → C)

  example : A → C :=
  fun h : A ↦
    show C from h2 (h1 h)
end

example (A B C: Prop) : (A → (B → C)) → (A ∧ B → C) :=
  fun h1 : A → (B → C) ↦
    fun h2 : A ∧ B ↦ h1 (And.left h2) (And.right h2)

example (A B C: Prop) : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) :=
  fun h1 : A ∧ (B ∨ C) ↦
    Or.elim (And.right h1)
      /- Note the slightly different API between Or.intro_left and Or.inl -/
      (fun h2 : B ↦ show (A ∧ B) ∨ (A ∧ C) from Or.intro_left (A ∧ C) (And.intro (And.left h1) h2))
      (fun h2 : C ↦ show (A ∧ B) ∨ (A ∧ C) from Or.inr (And.intro (And.left h1) h2))

#check Or.intro_left
#check Or.inl

/- A more concise version of the above -/
example (A B C: Prop) : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) :=
  λ h1 ↦ Or.elim (And.right h1)
      (λ h2 ↦ Or.inl  (And.intro (And.left h1) h2))
      (λ h2 ↦ Or.inr (And.intro (And.left h1) h2))

/- OO Notation -/
example (A B C: Prop) : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) :=
  λ h1 ↦ Or.elim h1.right
      (λ h2 ↦ Or.inl  (And.intro (And.left h1) h2))
      (λ h2 ↦ Or.inr (And.intro (And.left h1) h2))
    
/- --------------- -/
/- 4.4 Tactic Mode -/
/- --------------- -/
example (A B C: Prop) : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) := by
  /- We introduce an assumption, e.g. a lambda -/
  intro (h1 : A ∧ (B ∨ C))
  cases h1 with
  /- There is only one assumption about h1 -/
  | intro h1 h2 => cases h2 with
    | inl h2 =>
      /- Goal becomes A ∧ B -/
      apply Or.inl
      apply And.intro
      exact h1
      exact h2
    /- A ∧ C -/
    | inr h2 =>
      /- Goal becomes A ∧ C -/
      apply Or.inr
      apply And.intro
      exact h1
      exact h2

/- --------------------- -/
/- 4.5 Forward Reasoning -/
/- --------------------- -/


-- have is basically let
section
  variable (h1 : A → B)
  variable (h2 : B → C)

  -- term mode
  example : A → C :=
    fun h : A ↦
      have h3 : B := h1 h
      show C from h2 h3

  -- tactic mode
  example : A → C := by
    intro (h : A)
    have h3 : B := h1 h
    show C
    exact h2 h3
end 

-- from previously
example (A B C: Prop) : (A → (B → C)) → (A ∧ B → C) :=
  fun h1 : A → (B → C) ↦
    fun h2 : A ∧ B ↦ 
    show C from h1 (And.left h2) (And.right h2)

-- now in tactic mode
example (A B C: Prop) : (A → (B → C)) → (A ∧ B → C) := by
  intro (h1: A → (B → C)) (h2: A ∧ B)
  exact h1 (And.left h2) (And.right h2)

-- And introduction rule
------------------------
example (A B : Prop) : A ∧ B → B ∧ A := by
  intro (h1 : A ∧ B)
  have h2 : A := And.left h1
  have h3 : B := And.right h1
  show B ∧ A
  exact And.intro h3 h2

-- a variant of that
example (A B : Prop) : A ∧ B → B ∧ A := by
  intro (h1 : A ∧ B)
  apply And.intro
  . show B
    exact And.right h1
  . show A
    exact And.left h1

-- Another example
------------------
example (A B C : Prop) : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) := by
intro (h1 : A ∧ (B ∨ C))
have h2 : A := And.left h1
have h3 : B ∨ C := And.right h1
show (A ∧ B) ∨ (A ∧ C)
apply Or.elim h3
. intro (h4: B)
  have h5 : A ∧ B := And.intro h2 h4
  show (A ∧ B) ∨ (A ∧ C)
  exact Or.inl h5
. intro (h4: C)
  have h5 : A ∧ C := And.intro h2 h4
  show (A ∧ B) ∨ (A ∧ C)
  exact Or.inr h5

-- term mode
example (A B C : Prop) : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) :=
fun h1 : A ∧ (B ∨ C) ↦
have h2 : A := And.left h1
have h3 : B ∨ C := And.right h1
show (A ∧ B) ∨ (A ∧ C) from
  Or.elim h3
    (fun h4 : B ↦
      have h5 : A ∧ B := And.intro h2 h4
      show (A ∧ B) ∨ (A ∧ C) from Or.inl h5)
    (fun h4 : C ↦
      have h5 : A ∧ C := And.intro h2 h4
      show (A ∧ B) ∨ (A ∧ C) from Or.inr h5)


/- ---------------------------- -/
/- 4.6 Definitions and Theorems -/
/- ---------------------------- -/
def triple_and (A B C : Prop) : Prop :=
  A ∧ (B ∧ C)

variable (D E F G : Prop)

#check triple_and (D ∨ E) (¬ F → G) (¬ D)

-- theorem is like a def but specialised to Proposition
theorem and_commute (A B: Prop) : A ∧ B → B ∧ A :=
  fun h ↦ And.intro (And.right h) (And.left h)

#check A ∧ B → B ∧ A

-- Version with implicit type parameters
theorem and_commute_2 {A B: Prop} : A ∧ B → B ∧ A :=
  fun h ↦ And.intro (And.right h) (And.left h)

variable (C D E : Prop)
variable (h1 : C ∧ ¬ D)
variable (h2 : ¬ D ∧ C → E)
example : E := h2 (and_commute C (¬ D) h1)
example : E := h2 (and_commute_2 h1)

namespace hidden
variable {A B : Prop}

-- Interestingly this theorem doesn't explicitly have a proof as the "function type"
-- But is rather a more classical def on functions
theorem Or_resolve_left (h1 : A ∨ B) (h2 : ¬ A) : B :=
  Or.elim h1
    (fun h3 : A ↦ show B from False.elim (h2 h3))
    (fun h3 : B ↦ show B from h3)


theorem Or_resolve_right (h1 : A ∨ B) (h2 : ¬ B) : A :=
  Or.elim h1
    (fun h3 : A ↦ show A from h3)
    (fun h3 : B ↦ show A from False.elim (h2 h3))

end hidden

-- Another version of Or_resolve_left with a "pure proposition" prototype
theorem Or_resolve_left_2 : A ∨ B → ¬ A → B :=
  fun h1 ↦
  fun h2 ↦
  Or.elim h1
    (fun h3 : A ↦ show B from False.elim (h2 h3))
    (fun h3 : B ↦ show B from h3)

/- --------------------- -/
/- 4.7 Additional Syntax -/
/- --------------------- -/
example : A → A ∨ B := by
  -- Anonymous intro
  intro
  show A ∨ B
  apply Or.inl
  -- Refers to the unnamed hypothesis of type A, the one introduced by assumption
  assumption

-- ‹ A › is an anonymous assumption where instead of calling assumption we refer to the proportion
-- name. \ f< (french quotes)
example : A → A ∨ B :=
  fun _ ↦ Or.inl ‹ A ›

theorem my_theorem {A B C: Prop} : A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C) := by
  intro (h : A ∧ (B ∨ C))
  have : A := h.left
  have : B ∨ C := h.right
  show (A ∧ B) ∨ (A ∧ C)
  apply Or.elim ‹ B ∨ C ›
  . intro
    have : A ∧ B := And.intro ‹ A › ‹ B ›
    show (A ∧ B) ∨ (A ∧ C)
    apply Or.inl
    assumption
  . intro
    have : A ∧ C := And.intro ‹ A › ‹ C ›
    show (A ∧ B) ∨ (A ∧ C)
    apply Or.inr
    assumption

-- ⟨ ⟩ shortcut for And.intro ( \ <)
example (A B : Prop) : A ∧ B → B ∧ A :=
  fun h : A ∧ B ↦
  show B ∧ A from ⟨ h.right, h.left ⟩

example (A B : Prop) : A ∧ B → B ∧ A :=
  fun ⟨ h₁, h₂ ⟩ ↦ ⟨ h₂, h₁⟩

example (A B: Prop) : A ∧ B ↔ B ∧ A :=
  ⟨fun ⟨h₁, h₂⟩ ↦ ⟨h₂, h₁⟩, fun ⟨h₁, h₂⟩ ↦ ⟨h₂, h₁⟩⟩

/- ------------- -/
/- 4.8 Exercises -/
/- ------------- -/

-------
-- A --
-------

-- Term
example : A ∧ (A → B) → B :=
  fun ⟨a, ab⟩ ↦ show B from ab a

-- Tactic
example : A ∧ (A → B) → B := by
  intro ⟨a, ab⟩
  exact ab a

-------
-- B --
-------

-- Term
example : A → ¬ (¬ A ∧ B) :=
  fun a ↦
    show ¬ (¬ A ∧ B) from
      fun ⟨na, _⟩ ↦ show False from na a

-- Tactic
example : A → ¬ (¬ A ∧ B) := by
  intro
  show ¬ (¬ A ∧ B)
  intro ⟨na, b⟩
  show False
  apply na
  assumption

-------
-- C --
-------
  
-- Term
example : ¬ (A ∧ B) → (A → ¬ B) :=
  fun nab ↦
    fun a ↦
      show ¬ B from
        fun b ↦ nab (And.intro a b)

-- Tactic
example : ¬ (A ∧ B) → (A → ¬ B) := by
  intro nab a b
  exact nab ⟨a, b⟩

-------
-- D --
-------

-- Term
example (h₁ : A ∨ B) (h₂ : A → C) (h₃ : B → D) : C ∨ D :=
  show C ∨ D from
  Or.elim h₁
    (fun a ↦ Or.inl (h₂ a))
    (fun b ↦ Or.inr (h₃ b))

-- Tactic
example (h₁ : A ∨ B) (h₂ : A → C) (h₃ : B → D) : C ∨ D := by
  show C ∨ D
  apply Or.elim h₁
    (fun a ↦ Or.inl (h₂ a))
    (fun b ↦ Or.inr (h₃ b))

-------
-- E --
-------

-- Term
example (h : ¬ A ∧ ¬ B) : ¬ (A ∨ B) :=
  show ¬ (A ∨ B) from
  fun aorb ↦ Or.elim aorb
    (fun a ↦ (h.left a))
    (fun b ↦ (h.right b))

-- Tactic
example (h : ¬ A ∧ ¬ B) : ¬ (A ∨ B) := by
  show ¬ (A ∨ B)
  intro ab
  apply Or.elim ab
  . intro
    apply h.left
    assumption
  . intro
    apply h.right
    assumption

-------
-- F --
-------

-- Term
example : ¬ (A ↔ ¬ A) :=
  fun ana ↦ 
    have na := show ¬ A from
      fun a ↦ (ana.mp a) a
    show False from
      na (ana.mpr na)

-- Tactic
example : ¬ (A ↔ ¬ A) := by
  intro ana
  show False
  have na : ¬ A := by
    intro a
    exact (ana.mp a) a
  have A := by
    apply ana.mpr
    assumption
  apply na
  assumption
