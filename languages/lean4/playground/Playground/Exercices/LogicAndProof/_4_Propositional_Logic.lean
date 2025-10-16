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
