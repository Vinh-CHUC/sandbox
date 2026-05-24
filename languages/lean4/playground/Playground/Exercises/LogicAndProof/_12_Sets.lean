import Mathlib.Data.Set.Basic
import Mathlib.Order.BooleanAlgebra.Set
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
