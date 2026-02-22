-- 9.1 Functions Predicates and Relations
-- Axiom programming equivalent: declared but not defined?
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
