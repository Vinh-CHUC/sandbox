module StateMachine

data StateValue = A | B | C | D

Next: StateValue -> StateValue
Next A = B
Next B = C
Next C = D
Next D = D


data State : StateValue -> Type where
  Embed : (val: StateValue) -> State val
  NextState : (val: StateValue) -> State (Next val)

step : {a: _} -> State a -> State (Next a)
step _ = NextState a
-- This does not work
-- step _ = Embed a
