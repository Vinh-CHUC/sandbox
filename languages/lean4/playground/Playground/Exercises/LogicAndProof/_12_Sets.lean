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
