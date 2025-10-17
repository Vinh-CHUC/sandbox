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
