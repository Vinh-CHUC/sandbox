/-!

AI WRITTEN. DO CAREFULLY REVIEW STEP BY STEP TO UNDERSTAND

# TAPL Chapter 9 — Simply Typed Lambda Calculus

Built incrementally:
1. syntax (`Ty`, `Tm`)
2. contexts (`Ctx`)
3. the typing judgment (`HasType`)  -- TAPL figure 9-1
4. substitution (`Tm.subst`)        -- TAPL 5.3.5
5. the substitution lemma           -- TAPL 9.3.8
-/

/-! ## 1. Syntax -/

abbrev Var := String

/-- `base name` is an atomic type, e.g. TAPL's unspecified `A`, `B`, `C`, ...
    The `String` is its identity: `.base "A" ≠ .base "B"`. -/
inductive Ty where
  | base : String → Ty
  | arr : Ty → Ty → Ty
deriving Repr, DecidableEq

#eval Ty.base "A" == Ty.base "A"   -- true
#eval Ty.base "A" == Ty.base "B"   -- false, distinct atoms


inductive Tm where
  | var : Var → Tm
  | app : Tm → Tm → Tm
  | lam : Var → Ty → Tm → Tm
deriving Repr, DecidableEq

#eval Tm.var "x"
#eval Tm.app (Tm.var "x") (Tm.var "y")

/-- `λx:A. x` -/
def idA : Tm := .lam "x" (.base "A") (.var "x")

-- TAPL's `Γ` is a list of bindings, but a *function* `Var → Option Ty` is nicer in Lean?
-- No need to represent an explicit List that would make things a bit more complicated around
-- equality of contexts?

abbrev Ctx := Var → Option Ty

def emptyCtx : Ctx := fun _ => none

def Ctx.extend (Γ : Ctx) (x : Var) (T : Ty) : Ctx :=
  fun y => if y = x then some T else Γ y

#eval (emptyCtx.extend "x" (.base "A")) "x"   -- some Ty.base
#eval (emptyCtx.extend "x" (.base "A")) "y"   -- none

@[simp] theorem Ctx.extend_eq (Γ : Ctx) (x : Var) (T : Ty) : (Γ.extend x T) x = some T := by
  simp [Ctx.extend]

@[simp] theorem Ctx.extend_ne (Γ : Ctx) {x y : Var} (h : y ≠ x) (T : Ty) :
    (Γ.extend x T) y = Γ y := by
  simp [Ctx.extend, h]

/-! ## 3. The typing judgment

TAPL figure 9-1, transliterated: each inference rule becomes a constructor, each premise
an argument. `Prop` (not `Type`) because we care that a derivation exists, not which one. -/

inductive HasType : Ctx → Tm → Ty → Prop where
  | var {Γ x T} :
      Γ x = some T → HasType Γ (.var x) T
  | app {Γ t₁ t₂ T₁ T₂} :
      HasType Γ t₁ (.arr T₁ T₂) → HasType Γ t₂ T₁ → HasType Γ (.app t₁ t₂) T₂
  | lam {Γ x T₁ t₂ T₂} :
      HasType (Γ.extend x T₁) t₂ T₂ → HasType Γ (.lam x T₁ t₂) (.arr T₁ T₂)

notation:40 Γ " ⊢ " t " ∶ " T => HasType Γ t T

/-! ### 3a. Playing with derivations

    x:A ⊢ x : A
   --------------- T-Abs
   ⊢ λx:A. x : A→A
-/

example : emptyCtx ⊢ idA ∶ (.arr (.base "A") (.base "A")) := by
  apply HasType.lam
  apply HasType.var
  simp [Ctx.extend]

/-- The same derivation written as a *term*: the proof tree is literally the expression tree. -/
example : emptyCtx ⊢ idA ∶ (.arr (.base "A") (.base "A")) :=
  .lam (.var (by simp))

/-- `f:A→A, x:A ⊢ f x : A`  — T-App. -/
example :
    ((emptyCtx.extend "f" (.arr (.base "A") (.base "A"))).extend "x" (.base "A"))
      ⊢ (.app (.var "f") (.var "x")) ∶ (.base "A") := by
  apply HasType.app (T₁ := (.base "A"))
  · exact .var (by simp [Ctx.extend])
  · exact .var (by simp)

/-- `f:A→A ⊢ f : A→A` but applying it to a `B` is untypable — this is the case the `String`
    payload actually buys us: `.base "A" ≠ .base "B"`, so no `T₁` unifies both premises of
    T-App. Note the argument's *own* subderivation typechecks fine (`x:B ⊢ x : B`); it's the
    `HasType.app` unification that fails. -/
example :
    ¬ ∃ T, ((emptyCtx.extend "f" (.arr (.base "A") (.base "A"))).extend "x" (.base "B"))
      ⊢ (.app (.var "f") (.var "x")) ∶ T := by
  rintro ⟨T, h⟩
  cases h with
  | app hf hx =>
    cases hf with
    | var hf' =>
      cases hx with
      | var hx' =>
        simp only [Ctx.extend, if_true, if_neg (by decide : ¬ ("f" = "x")),
          if_neg (by decide : ¬ ("x" = "f"))] at hf' hx'
        injection hx' with hx''
        rw [← hx''] at hf'
        injection hf' with harr
        injection harr with hDom _
        exact absurd hDom (by decide)

/-- Ill-typed terms have *no* derivation. Note how `cases` inverts the judgment: only
    `HasType.var` could have concluded this, and its premise is `emptyCtx "x" = some T`. -/
example : ¬ ∃ T, emptyCtx ⊢ (.var "x") ∶ T := by
  rintro ⟨T, h⟩
  cases h with
  | var hx => simp [emptyCtx] at hx

/-- Self-application `λx:A. x x` is untypable at `A` — the classic TAPL example. -/
example : ¬ ∃ T, emptyCtx ⊢ (.lam "x" (.base "A") (.app (.var "x") (.var "x"))) ∶ T := by
  rintro ⟨T, h⟩
  cases h with
  | lam hbody =>
    cases hbody with
    | app hf ha =>
      cases hf with
      | var hx => simp [Ctx.extend] at hx

/-! ## 4. Free variables

Needed to state weakening honestly (TAPL hides this behind convention 5.3.4). -/

def Tm.FV : Tm → List Var
  | .var x => [x]
  | .app t₁ t₂ => t₁.FV ++ t₂.FV
  | .lam x _ t => t.FV.filter (· != x)

#eval idA.FV                                          -- []
#eval (Tm.lam "x" (.base "A") (.var "y")).FV                -- ["y"]

/-! ### 4a. The one admin lemma

TAPL's *permutation* (9.3.5) and *weakening* (9.3.6) are both instances of this:
typing only looks at the context through the free variables of the term. -/

theorem HasType.congr_ctx {Γ t T} (ht : Γ ⊢ t ∶ T) :
    ∀ {Γ' : Ctx}, (∀ x ∈ t.FV, Γ' x = Γ x) → (Γ' ⊢ t ∶ T) := by
  induction ht with
  | var hx => intro Γ' h; exact .var ((h _ (by simp [Tm.FV])).trans hx)
  | app _ _ ih₁ ih₂ =>
    intro Γ' h
    exact .app (ih₁ (fun x hx => h x (by simp [Tm.FV, hx]))) (ih₂ (fun x hx => h x (by simp [Tm.FV, hx])))
  | @lam Γ x T₁ t₂ T₂ _ ih =>
    intro Γ' h
    refine .lam (ih (fun z hz => ?_))
    by_cases hzx : z = x
    · subst hzx; simp
    · rw [Ctx.extend_ne _ hzx, Ctx.extend_ne _ hzx]
      exact h z (by simp [Tm.FV, List.mem_filter, hz, hzx])

/-- Weakening (TAPL 9.3.6), for a binder not free in the term. -/
theorem HasType.weaken {Γ t T y S} (ht : Γ ⊢ t ∶ T) (hy : y ∉ t.FV) :
    (Γ.extend y S) ⊢ t ∶ T :=
  ht.congr_ctx (fun z hz => Ctx.extend_ne _ (by rintro rfl; exact hy hz) _)

/-! ## 5. Substitution (TAPL 5.3.5)

This is the *naive* (capture-prone) definition: in the `lam` case we do not rename `y`,
so substituting `y` into `λy:T. …` would capture. TAPL sweeps this under convention 5.3.4. -/

def Tm.subst (t : Tm) (x : Var) (s : Tm) : Tm :=
  match t with
  | .var y => if y = x then s else .var y
  | .app t₁ t₂ => .app (t₁.subst x s) (t₂.subst x s)
  | .lam y T t₁ => if y = x then .lam y T t₁ else .lam y T (t₁.subst x s)

notation:max "[" x " ↦ " s "]" t => Tm.subst t x s

#eval [ "x" ↦ Tm.var "z" ] (Tm.var "x")                       -- var "z"
#eval [ "x" ↦ Tm.var "z" ] idA                                -- λx:A. x   (shadowed, unchanged)
#eval [ "x" ↦ Tm.var "z" ] (Tm.lam "y" (.base "A") (.var "x"))      -- λy:A. z

/-! ## 6. The substitution lemma (TAPL 9.3.8)

    If  Γ, x:S ⊢ t : T   and   Γ ⊢ s : S   then   Γ ⊢ [x ↦ s]t : T.

Two Lean-specific wrinkles worth staring at:

**(a) the `Δ = Γ.extend x S` trick.** TAPL says "by induction on a derivation of `Γ, x:S ⊢ t : T`".
In Lean, `induction ht` needs the indices of `ht` to be *variables*, but the context index here
is the compound term `Γ.extend x S`. So we abstract it to a fresh `Δ` plus an equation, and
`generalizing Γ` so the T-Abs case may instantiate the IH at a *bigger* context.

**(b) freshness.** In the T-Abs case TAPL says "by convention we may assume `y ∉ FV(s)`".
We can't say that — with naive `subst`, the lemma is simply false without it. So we take
`s` closed, which is the common case (and makes weakening free). -/

theorem HasType.subst_preserves {Δ t T} (ht : Δ ⊢ t ∶ T) :
    ∀ {Γ x S s}, Δ = Γ.extend x S → (Γ ⊢ s ∶ S) → s.FV = [] →
      (Γ ⊢ ([x ↦ s] t) ∶ T) := by
  induction ht with
  | @var Δ z T hz =>
    -- TAPL: "two sub-cases, depending on whether z is x or another variable"
    intro Γ x S s rfl hs hclosed
    simp only [Tm.subst]
    by_cases hzx : z = x
    · -- z = x, so [x ↦ s]z = s, and S = T from the context lookup
      subst hzx
      rw [if_pos rfl]
      simp at hz
      exact hz ▸ hs
    · -- otherwise [x ↦ s]z = z, "and the desired result is immediate"
      rw [if_neg hzx]
      exact .var (by rwa [Ctx.extend_ne _ hzx] at hz)
  | app _ _ ih₁ ih₂ =>
    intro Γ x S s heq hs hclosed
    exact .app (ih₁ heq hs hclosed) (ih₂ heq hs hclosed)
  | @lam Δ y T₂ t₁ T₁ _ ih =>
    intro Γ x S s rfl hs hclosed
    simp only [Tm.subst]
    by_cases hyx : y = x
    · -- the binder shadows x: [x ↦ s](λx:T₂. t₁) = λx:T₂. t₁
      subst hyx
      rw [if_pos rfl]
      refine .lam (HasType.congr_ctx ‹_› (fun z _ => ?_))
      by_cases hzy : z = y <;> simp [Ctx.extend, hzy]
    · rw [if_neg hyx]
      refine .lam (ih (Γ := Γ.extend y T₂) (x := x) (S := S) ?_ ?_ hclosed)
      · -- permutation (TAPL 9.3.5): the two extensions commute since y ≠ x
        funext z
        by_cases hzy : z = y <;> by_cases hzx : z = x <;>
          simp_all [Ctx.extend]
      · -- weakening (TAPL 9.3.6): free because s is closed
        exact hs.weaken (by simp [hclosed])

/-! ### 6a. Where it breaks without freshness

With naive `subst`, `λy:T. [x ↦ y] …` captures. Concretely: `Γ = (y:A)`, `s = y`, and
`t = λy:A→A. x`. Then `Γ, x:A ⊢ t : (A→A)→A`, `Γ ⊢ y : A`, but `[x ↦ y]t = λy:A→A. y`
which has type `(A→A)→(A→A)`, not `(A→A)→A`. The fix is either capture-avoiding
substitution (rename the binder) or de Bruijn indices — that's the natural next step. -/

example :
    ([ "x" ↦ Tm.var "y" ] (Tm.lam "y" (.arr (.base "A") (.base "A")) (.var "x")))
      = Tm.lam "y" (.arr (.base "A") (.base "A")) (.var "y") := by
  native_decide
