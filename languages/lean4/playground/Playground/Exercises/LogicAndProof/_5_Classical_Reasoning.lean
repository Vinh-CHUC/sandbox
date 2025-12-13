import Mathlib.Tactic

section
  open Classical
  variable (A: Prop)

  example: A :=
  byContradiction
    (fun h : ¬ A ↦ show False from sorry)

/- Law of excluded middle -/
  example: A ∨ ¬ A := by
    apply byContradiction
    intro (h1 : ¬ (A ∨ ¬ A))
    have h2 : ¬ A := by
      intro (h3: A)
      have h4: A ∨ ¬ A := Or.inl h3
      show False
      exact h1 h4
    have h5: A ∨ ¬ A := Or.inr h2
    show False
    exact h1 h5

  example : A ∨ ¬ A := Classical.em A

/- Double negation elimination -/
  example : ¬ ¬ A ↔ A :=
  Iff.intro
    (fun h1 : ¬ ¬ A ↦
      show A from byContradiction
        (fun h2 : ¬ A ↦
          show False from h1 h2))
    (fun h1 : A ↦
      show ¬ ¬ A from fun h2: ¬ A ↦ h2 h1)

/- Double negation elimination: Tactic mode -/
  example : ¬ ¬ A ↔ A := by
    apply Iff.intro
    . intro (h1 : ¬ ¬ A)
      apply byContradiction
      intro h2
      show False
      exact h1 h2
    . intro (h3: A)
      apply Not.intro
      intro (h2: ¬ A)
      exact h2 h3
end 

section
  open Classical
  variable (A B : Prop)

  example (h : ¬ B → ¬ A) : A → B := by
    intro (h1 : A) 
    show B
    apply byContradiction
    intro (h2 : ¬ B)
    have h3 : ¬ A := h h2
    show  False
    exact h3 h1

  example (h : ¬ (A ∧ ¬ B)): A → B := by
    intro a
    show B
    apply byContradiction
    intro nb
    have : A ∧ ¬ B := And.intro a nb
    show False
    apply h
    assumption

  example : (A → B) ∨ (B → A) :=
  Or.elim (Classical.em B)
    (fun h : B ↦ 
      have : A → B :=
        fun _ : A ↦ show B from h
      show (A → B) ∨ (B → A) from Or.inl this)
    (fun h: ¬ B ↦
      have : B → A :=
        fun _: B ↦
          have : False := h ‹ B ›
          show A from False.elim this
      show (A → B) ∨ (B → A) from Or.inr this)

  /- Tactical mode -/
  example : (A → B) ∨ (B → A) := by
  apply Or.elim (Classical.em B)
  . intro b
    have : A → B := by
      intro
      assumption
    apply Or.inl
    assumption
  . intro nb
    have : B → A := by
      intro b
      apply False.elim
      exact nb b
    apply Or.inr
    assumption
end 

/- ---------------------------- -/
/- 5.3 The contradiction tactic -/
/- ---------------------------- -/
section
  open Classical
  variable (A: Prop)

  /- Law of excluded middle -/
  example: A ∨ ¬ A := by
    apply byContradiction
    intro (h1 : ¬ (A ∨ ¬ A))
    have h2 : ¬ A := by
      intro (h3: A)
      have h4: A ∨ ¬ A := Or.inl h3
      show False
      exact h1 h4
    have h5: A ∨ ¬ A := Or.inr h2
    show False
    exact h1 h5


  /- Same but with contradiction tactic -/
  example: A ∨ ¬ A := by
    apply byContradiction
    intro (h1 : ¬ (A ∨ ¬ A))
    have h2 : ¬ A := by
      intro (h3: A)
      have h4: A ∨ ¬ A := Or.inl h3
      /- Will automatically search for h1 h4? -/
      /- e.g. something of the form A and ¬ A -/
      contradiction
    have h5: A ∨ ¬ A := Or.inr h2
    contradiction

  /- Even more concise -/
  example: A ∨ ¬ A := by
    apply byContradiction
    intro
    have : ¬ A := by
      intro
      have : A ∨ ¬ A := Or.inl ‹ A ›
      /- Will automatically search for h1 h4? -/
      /- e.g. something of the form A and ¬ A -/
      contradiction
    have : A ∨ ¬ A := Or.inr  ‹ ¬ A ›
    contradiction
end

/- ------------- -/
/- 5.4 Exercises -/
/- ------------- -/

/- 1: Prove: Reductio Ab Absurdum from Law of excluded middle  -/
section
  open Classical

  /- Variant 1 -/
  example (h : ¬ A → False) : A := by
    apply Or.elim (Classical.em A)
    . intro
      assumption
    . intro
      have : False := by
        apply h
        assumption
      apply False.elim
      assumption

  /- Variant 2 -/
  example (h : ¬ A → False) : A := by
    apply Or.elim (Classical.em A)
    . intro
      assumption
    . intro
      have : False := by
        apply h
        assumption
      /- It simply searches for False -/
      contradiction
end 

/- 2 -/
section
  open Classical

  example (h : ¬ A ∨ ¬ B) : ¬ (A ∧ B) := by
    intro a_and_b
    show False
    apply Or.elim h
    . intro na
      have : A := And.left a_and_b
      contradiction
    . intro nb
      have : B := And.right a_and_b
      contradiction
end 

/- 3 -/
/- This is quite convoluted, just following the hints -/
/- from the book -/
section
  open Classical

  example (h : ¬ (A ∧ B)) : ¬ A ∨ ¬ B := by
    have a_to_nb : (a : A) → ¬ B := by
      intro
      intro
      have : A ∧ B := ⟨ ‹ A › , ‹ B › ⟩
      contradiction
    have n_na_or_nb_to_na : ¬(¬ A ∨ ¬ B) → ¬ A := by
      intro
      intro
      have : ¬ B := a_to_nb ‹ A ›
      have : ¬ A ∨ ¬ B := Or.inr ‹ ¬ B ›
      contradiction
    have h3: ¬(¬(¬ A ∨ ¬ B)) := by
      intro
      have : ¬ A := by
        apply n_na_or_nb_to_na
        assumption
      have : ¬ A ∨ ¬ B := Or.inl ‹ ¬ A ›
      contradiction
    -- This is an indirect way of using ¬ ¬ A = A
    --
    -- If you have ¬ ¬ A, proving A byContradiction introduces ¬ A
    apply byContradiction
    intro
    contradiction

  /- Simpler variant -/
  example (h : ¬ (A ∧ B)) : ¬ A ∨ ¬ B := by
    apply Or.elim (Classical.em A)
    . intro
      have: ¬ B := by
        intro
        have: A ∧ B := ⟨‹ A ›,  ‹B ›⟩
        contradiction
      apply Or.inr
      assumption
    . intro
      apply Or.inl
      assumption
end 

/- 4 -/
section
  open Classical

  example 
    (h: ¬ P → (Q ∨ R))
    (h2: ¬ Q)
    (h3: ¬ R)
    : P := by
      apply byContradiction
      intro
      have : Q ∨ R := h ‹ ¬ P ›
      apply Or.elim ‹ Q ∨ R ›
      . intro
        contradiction
      . intro
        contradiction
end

/- 5 -/
section
  open Classical

  example (h: A → B) : ¬ A ∨ B := by
    apply Or.elim (Classical.em A)
    . intro
      apply Or.inr (h ‹ A ›)
    . intro
      apply Or.inl
      assumption
end

/- 6 -/
section
  open Classical

  example:
  A → ((A ∧ B) ∨ (A ∧ ¬ B)) := by
    intro
    apply Or.elim (Classical.em B)
    . intro
      have: A ∧ B := ⟨ ‹ A ›, ‹ B › ⟩
      apply Or.inl
      assumption
    . intro
      have: A ∧ ¬ B := ⟨ ‹ A ›, ‹ ¬ B › ⟩
      apply Or.inr
      assumption
end

/- 7 -/
section
  open Classical

  example: ((A ∨ B) ∧ (C ∨ D) ∧ (E ∨ F))
  →  (
     (A ∧ C ∧ E) ∨ (A ∧ C ∧ F)
     ∨ (A ∧ D ∧ E) ∨ (A ∧ D ∧ F)
     ∨ (B ∧ C ∧ E) ∨ (B ∧ C ∧ F)
     ∨ (B ∧ D ∧ E) ∨ (B ∧ D ∧ F)
  ) := by
    intro h
    have: A ∨ B := And.left h
    have: C ∨ D := And.left (And.right h)
    have: E ∨ F := And.right (And.right h)
    apply Or.elim ‹ A ∨ B ›
    . intro
      apply Or.elim ‹ C ∨ D ›
      . intro
        apply Or.elim ‹ E ∨ F ›
        . intro
          have: A ∧ C ∧ E :=
            And.intro ‹ A › (And.intro ‹ C › ‹ E ›)
          apply Or.inl
          assumption
        . intro
          have: A ∧ C ∧ F :=
            And.intro ‹ A › (And.intro ‹ C › ‹ F ›)
          apply Or.inr
          apply Or.inl
          assumption
      . intro
        apply Or.elim ‹ E ∨ F ›
        . intro
          have: A ∧ D ∧ E :=
            And.intro ‹ A › (And.intro ‹ D › ‹ E ›)
          apply Or.inr
          apply Or.inr
          apply Or.inl
          assumption
        . intro
          have: A ∧ D ∧ F :=
            And.intro ‹ A › (And.intro ‹ D › ‹ F ›)
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inl
          assumption
    . intro
      apply Or.elim ‹ C ∨ D ›
      . intro
        apply Or.elim ‹ E ∨ F ›
        . intro
          have: B ∧ C ∧ E :=
            And.intro ‹ B › (And.intro ‹ C › ‹ E ›)
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inl
          assumption
        . intro
          have: B ∧ C ∧ F :=
            And.intro ‹ B › (And.intro ‹ C › ‹ F ›)
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inl
          assumption
      . intro
        apply Or.elim ‹ E ∨ F ›
        . intro
          have: B ∧ D ∧ E :=
            And.intro ‹ B › (And.intro ‹ D › ‹ E ›)
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inl
          assumption
        . intro
          have: B ∧ D ∧ F :=
            And.intro ‹ B › (And.intro ‹ D › ‹ F ›)
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          apply Or.inr
          assumption
  end

/- 8 -/
section

open Classical
variable {A B C : Prop}

-- Prove ¬ (A ∧ B) → ¬ A ∨ ¬ B by replacing the sorry's below
-- by proofs.

lemma step1 (h₁ : ¬ (A ∧ B)) (h₂ : A) : ¬ A ∨ ¬ B :=
have : ¬ B := by
  intro
  have: A ∧ B := ⟨ ‹ A › , ‹ B › ⟩
  contradiction
show ¬ A ∨ ¬ B from Or.inr this

lemma step2 (h₁ : ¬ (A ∧ B)) (h₂ : ¬ (¬ A ∨ ¬ B)) : False :=
have : ¬ A :=
  fun _ : A ↦
  have : ¬ A ∨ ¬ B := step1 h₁ ‹A›
  show False from h₂ this
have : (¬ A ∨ ¬ B) := Or.inl ‹ ¬ A ›
show False from h₂ this

theorem step3 (h : ¬ (A ∧ B)) : ¬ A ∨ ¬ B :=
byContradiction
  (fun h' : ¬ (¬ A ∨ ¬ B) ↦
    show False from step2 h h')

end

/- 9 -/
section
open Classical
variable {A B C : Prop}

example (h : ¬ B → ¬ A) : A → B := by
  intro
  apply byContradiction
  intro
  have: ¬ A := by
    apply h
    assumption
  contradiction

example (h : A → B) : ¬ A ∨ B := by
  apply Or.elim (Classical.em A)
  . intro
    have: B := h ‹ A ›
    apply Or.inr
    assumption
  . intro
    apply Or.inl
    assumption
end
