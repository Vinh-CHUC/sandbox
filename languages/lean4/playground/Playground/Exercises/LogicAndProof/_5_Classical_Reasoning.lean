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

  example : A ∨ ¬ A := em A

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
