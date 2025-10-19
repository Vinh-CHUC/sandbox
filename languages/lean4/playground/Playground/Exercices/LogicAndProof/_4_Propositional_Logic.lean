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

example : A ∧ B → ¬ B ∧ A :=
  fun h : A ∧ B ↦ And.intro _ _

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
    fun h2 : A ∧ B ↦

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
  intro (h1 : A ∧ (B ∨ C))
  cases h1 with
  | intro h1 h2 => cases h2 with
    | inl h2 =>
      apply Or.inl
      apply And.intro
      exact h1
      exact h2
    | inr h2 =>
      apply Or.inr
      apply And.intro
      exact h1
      exact h2
