import Mathlib.Data.Set.Basic
import Mathlib.Order.BooleanAlgebra.Set
import Mathlib.Order.SetNotation
open Set

-----------------
-- 12.1 Basics --
-----------------

variable {U : Type}
variable (A B C: Set U)
variable (x : U)

#check x ∈ A
#check A ∪ B
#check B \ C
#check C ∩ A
#check Cᶜ
#check ∅ ⊆ A
#check B ⊆ univ

------------------------
-- Showing that A ⊆ B --
-- --> that is definitionally ∀ x, x ∈ A → x ∈ B
------------------------

-- term mode
example: A ⊆ B :=
  fun x ↦
  fun (h : x ∈ A) ↦
  show x ∈ B from sorry

-- tactic mode
example: A ⊆ B := by
  intro x
  intro (h: x ∈ A)
  show x ∈ B
  sorry

-- A = B --
-- Same as A ⊆ B ∧ B ⊆ A
-- Same as ∀ x, x ∈ A ↔ x ∈ B

-- term mode
example : A = B :=
ext (fun x ↦ Iff.intro
  (fun h: x ∈ A ↦
    show x ∈ B from sorry)
  (fun h: x ∈ B ↦
    show x ∈ A from sorry))

-- tactic mode
example : A = B := by
  ext x
  show x ∈ A ↔ x ∈ B
  apply Iff.intro
  . show x ∈ A → x ∈ B
    intro (h: x ∈ A)
    show x ∈ B
    sorry
  . show x ∈ B → x ∈ A
    intro (h: x ∈ B)
    show x ∈ A
    sorry

-- Set.ext embodies the following fact
-- ∀ x (x ∈ A ↔ x ∈ B) → A = B

-----------------------------------------
-- ∪ and ∩ rules hold "definitionally" --
-- "x ∈ A ∩ B" and "x ∈ A ∧ x ∈ B" mean the same thing
-----------------------------------------
example : ∀ x, x ∈ A → x ∈ B → x ∈ A ∩ B:=
  fun x ↦
  fun _: x ∈ A ↦
  fun _: x ∈ B ↦
  show x ∈ A ∩ B from And.intro ‹x ∈ A› ‹x ∈ B›
  -- show x ∈ A ∩ B from mem_inter ‹x ∈ A› ‹x ∈ B›

example: A ⊆ A ∪ B :=
  fun x ↦
  fun _: x ∈ A ↦
  show x ∈ A ∪ B from Or.inl ‹x ∈ A›
  -- mem_union_left

example : ∅ ⊆ A :=
  fun x ↦
  fun _: x ∈ ∅ ↦
  show x ∈ A from  False.elim ‹x ∈ ∅›

#check @mem_inter
#check Set.mem_of_mem_diff
#check Set.notMem_of_mem_diff

-- Proving some set inclusions --
example : A \ B ⊆ A :=
  fun x ↦
  fun h : x ∈ A \ B ↦
  show x ∈ A from And.left h
  /- show x ∈ A from mem_of_mem_diff h -/

example: A \ B ⊆ Bᶜ :=
  fun x ↦
  fun h : x ∈ A \ B ↦
  have : x ∉ B := notMem_of_mem_diff h
  /- have : x ∉ B := And.right h -/
  show x ∈ Bᶜ from this

--------------------------
-- 12.2 Some Identities --
--------------------------
theorem inter_union_subset {x} :
  (x ∈ A ∩ (B ∪ C)) → (x ∈ (A ∩ B) ∪ (A ∩ C)) := by
  intro (hx: x ∈ A ∩ (B ∪ C))
  have hA: x ∈ A := hx.left
  have hBC: x ∈ B ∪ C := hx.right
  cases hBC with
  | inl hB =>
    have : x ∈ A ∩ B := ⟨hA, hB⟩
    show x ∈ (A ∩ B) ∪ (A ∩ C)
    apply Or.inl
    assumption
  | inr hC =>
    have : x ∈ A ∩ C := ⟨hA, hC⟩
    show x ∈ (A ∩ B) ∪ (A ∩ C)
    apply Or.inr
    assumption

theorem inter_union_inter_subset {x} :
  (x ∈ (A ∩ B) ∪ (A ∩ C)) → (x ∈ A ∩ (B ∪ C)) := by
  intro (hx : x ∈ (A ∩ B) ∪ (A ∩ C))
  cases hx with
  | inl h =>
    show x ∈ A ∩ (B ∪ C)
    apply And.intro
    . show x ∈ A
      exact h.left
    . show x ∈ (B ∪ C)
      exact Or.inl h.right
  | inr h =>
    show x ∈ A ∩ (B ∪ C)
    apply And.intro
    . show x ∈ A
      exact h.left
    . show x ∈ (B ∪ C)
      exact Or.inr h.right

example : A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C) := by
  ext x
  constructor
  . exact inter_union_subset A B C
  . exact inter_union_inter_subset A B C

example : (A ∩ Bᶜ) ∪ B = A ∪ B :=
calc
  (A ∩ Bᶜ) ∪ B = (A ∪ B) ∩ (Bᶜ ∪ B) := by rw [inter_union_distrib_right]
  _ = (A ∪ B) ∩ univ := by rw [compl_union_self]
  _ = (A ∪ B) := by rw [inter_univ]

---------------------------
-- 12.3 Indexed Families --
---------------------------

variable {I U : Type}


-- A: I → Set U is an indexed family of sets
-- {x | P x} : this is definitionally a Set? ie the set of xs such that P x is true
-- In the cases below the P x is itself a predicate that involves quantification on set membership
def myiUnion(A : I → Set U) : Set U := {x | ∃ i: I, x ∈ A i}
def myiInter(A : I → Set U) : Set U := {x | ∀ i: I, x ∈ A i}

section
variable (x : U) (A: I → Set U)

-- In this case Lean can "definitionally unfold"
example (h : x ∈ myiUnion A) : ∃ i, x ∈ A i := h
example (h : x ∈ myiInter A) : ∀ i, x ∈ A i := h
end

-- The actual iUnion and iInter
#check mem_iUnion
#check mem_iInter

variable {A B : I → Set U}

theorem exists_of_mem_Union {x : U}
(h : x ∈ ⋃ i, A i):
∃ i, x ∈ A i := by
    rw [← mem_iUnion]
    assumption

theorem mem_Union_of_exists {x : U}
(h : ∃ i, x ∈ A i):
x ∈ ⋃ i, A i := by
    rw [mem_iUnion]
    assumption

theorem forall_of_mem_Inter {x : U}
(h : x ∈ ⋂ i, A i):
∀ i, x ∈ A i := by
rw [← mem_iInter]
assumption

theorem mem_Inter_of_forall {x : U}
(h: ∀ i, x ∈ A i) :
(x ∈ ⋂ i, A i):= by
rw [mem_iInter]
assumption

-- An example
example : (⋂ i, A i ∩ B i) = (⋂ i, A i) ∩ (⋂ i, B i) := by
  ext x
  show x ∈ ⋂ i, A i ∩ B i ↔ x ∈ (⋂ i, A i) ∧ x ∈ ⋂ i, B i
  rw [mem_iInter, mem_iInter, mem_iInter]
  show (∀ (i: I), x ∈ A i ∧ x ∈ B i) ↔
    (∀ (i: I), x ∈ A i) ∧ (∀ (i : I), x ∈ B i)
  constructor
  . intro (h : (∀ (i: I), x ∈ A i ∧ x ∈ B i))
    show (∀ (i: I), x ∈ A i) ∧ (∀ (i : I), x ∈ B i)
    constructor
    . show (∀ (i: I), x ∈ A i)
      exact fun j ↦ And.left $ h j
    . show (∀ (i: I), x ∈ B i)
      exact fun j ↦ And.right $ h j
  . intro (h: (∀ (i: I), x ∈ A i) ∧ (∀ (i : I), x ∈ B i))
    show ∀ i, x ∈ A i ∧ x ∈ B i
    exact fun j ↦ ⟨h.left j, h.right j⟩

-- Helpers
variable {I U : Type}
variable {A : I → Set U}

theorem Inter.intro {x : U} (h : ∀ i, x ∈ A i) : x ∈ ⋂ i, A i := by
  rw [mem_iInter]
  show ∀ i, x ∈ A i
  assumption

theorem Inter.elim {x : U} (h : x ∈ ⋂ i, A i) (i : I) : x ∈ A i := by
  rw [mem_iInter] at h
  apply h

theorem Union.intro {x : U} (i : I) (h : x ∈ A i) : x ∈ ⋃ i, A i := by
  rw [mem_iUnion]
  show ∃ i, x ∈ A i
  exact ⟨i, h⟩

theorem Union.elim {b : Prop} {x : U}
(h₁ : x ∈ ⋃ i, A i) (h₂ : ∀ (i : I), x ∈ A i → b) : b := by
  rw [mem_iUnion] at h₁
  cases h₁ with
  | intro i hi => exact h₂ i hi

-- Another
section
  variable {I U : Type}
  variable {A : I → Set U}
  variable {B : I → Set U}
  variable {C : Set U}

  example : (⋃ i, C ∩ A i) ⊆ C ∩ (⋃ i, A i) :=
    fun x : U ↦
    fun h : x ∈ ⋃ i, C ∩ A i ↦
    Union.elim h $
    fun i ↦
    fun h1 : x ∈ C ∩ A i ↦
    have h2 : x ∈ C := And.left h1
    have h3 : x ∈ A i := And.right h1
    have h4 : x ∈ ⋃ i, A i := Union.intro i h3
    show x ∈ C ∩ ⋃ i, A i from And.intro h2 h4
end

-- Indexed families, multiple indexing variables
section
variable {I J U: Type}
variable {A : I → J → Set U}

example : (⋃i, ⋂j, A i j) ⊆ (⋂j, ⋃i, A i j) :=
  fun x : U ↦
  fun h : x ∈ ⋃i, ⋂j, A i j ↦
  Union.elim h $
  fun i ↦
  fun h1 : x ∈ ⋂ j, A i j ↦
  show x ∈ ⋂j, ⋃i, A i j from
    Inter.intro $
    fun j ↦
    have h2 : x ∈ A i j := Inter.elim h1 j
    Union.intro i h2
end

---------------------
-- 12.4 Power Sets --
---------------------
section
variable {U : Type}

-- This shows that B ∈ power A is definitionally the same as B ⊆ A
def myPowerset(A : Set U) : Set (Set U) := {B : Set U | B ⊆ A}
end

--------------------
-- 12.5 Exercises --
--------------------

-- 1
section
  variable {A : Set U}
  variable {B : Set U}
  variable {C : Set U}

  example : ∀ x, x ∈ A ∩ C → x ∈ A ∪ B := by
    intro x x_a_and_c
    exact Or.inl $ And.left x_a_and_c

  example : ∀ x, x ∈ (A ∪ B)ᶜ → x ∈ Aᶜ := by
    intro x x_n_a_or_c x_in_a
    have x_in_a_or_b : x ∈ A ∪ B := Or.inl x_in_a
    contradiction
end

-- 2
section
  variable {U : Type}

  def disj (A B: Set U) : Prop := ∀ ⦃x⦄, x ∈ A → x ∈ B → False

  example (A B : Set U) (h : ∀ x, ¬ (x ∈ A ∧ x ∈ B)): disj A B :=
    fun x ↦
    fun h1 : x ∈ A ↦
    fun h2 : x ∈ B ↦
    have h3 : x ∈ A ∧ x ∈ B := And.intro h1 h2
    show False from h x h3

  -- Note that h1 x h2 h3 is not necessary given the implicit  ⦃x⦄ further above
  example (A B: Set U) (h1 : disj A B) (x : U) (h2 : x ∈ A) (h3 : x ∈ B) : False :=
    h1 h2 h3

  example (A B: Set U) (x : U) (h : A ⊆ B) (h1: x ∈ A) : x ∈ B :=
    h h1

  example (A B C D: Set U) (h1: disj A B) (h2 : C ⊆ A) (h3 : D ⊆ B) : disj C D := by
    intro x x_in_c x_in_d
    have x_in_a := h2 x_in_c
    have x_in_b := h3 x_in_d
    exact h1 x_in_a x_in_b
end

-- 3
section
  variable {I U : Type}
  variable (A : I → Set U) (B : I → Set U) (C : Set U)

  example : (⋂ i, A i) ∩ (⋂ i, B i) ⊆ (⋂ i, A i ∩ B i) := by
  intro x h1
  obtain ⟨ai, bi⟩ := h1
  apply mem_iInter.mpr
  intro i
  exact ⟨mem_iInter.mp ai i, mem_iInter.mp bi i⟩

  example : C ∩ (⋃ i, A i) ⊆ ⋃ i, C ∩ A i := by
  intro x h1
  obtain ⟨x_c, x_ai⟩ := h1
  rw [mem_iUnion]
  obtain ⟨i: I, _: x ∈ A i⟩ := (mem_iUnion.mp x_ai)
  constructor
  exact ⟨x_c, ‹x ∈ A i›⟩ 
end

-- 4
-- Worth philosophing about
section
  variable {U : Type}
  variable (A B C : Set U)

  example (h1 : A ⊆ B) (h2: B ⊆ C) : A ⊆ C := Subset.trans h1 h2

  example : A ⊆ A := Subset.refl A

  example (h : A ⊆ B) : powerset A ⊆ powerset B := by
  intro sa sa_in_pa
  apply Subset.trans
  . show sa ⊆ A
    exact sa_in_pa
  . show A ⊆ B
    exact h

  example (h : powerset A ⊆ powerset B) : A ⊆ B := by
  -- h is formally sa -> sa ∈ P A -> sa ∈ P B
  -- h is formally sa -> sa ⊆ A -> sa ⊆ B
  have : A ⊆ A := Subset.refl A
  apply h
  -- the first argument of h (of type Set A) is implicit
  show A ∈ powerset A
  assumption
end
