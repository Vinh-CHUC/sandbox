--------------------------- MODULE 5_TCommit ---------------------------
(* Everything is a set*)

(* A constant that is supplied by config *)
CONSTANT RM

VARIABLE rmState

(* 
Some kind of runtime predicate over values that "type checks"
The notation [S -> T] is a set of all functions with domain S and values T
*)
TCTypeOK == rmState \in [RM -> {"working", "prepared", "committed", "aborted"}]

(* Initially everythign is in the "working" state *)
TCInit == rmState = [r \in RM |-> "working"]

(*
RM r moves from "working" to "prepared"; others unchanged

Doing something like rmState'[r] wouldn't work! It only constraints that key
And here we wand to capture a transition only for r
*)
Prepare(r) == /\ rmState[r] = "working"
              /\ rmState' = [rmState EXCEPT ![r] = "prepared"]

canCommit == \A r \in RM: rmState[r] \in {"prepared", "committed"}

notCommitted == \A r \in RM: rmState[r] /= "committed"

Decide(r) == \/ /\ rmState[r] = "prepared"
                /\ canCommit
                /\ rmState' = [rmState EXCEPT ![r] = "committed"]
             \/ /\ rmState[r] \in {"working", "prepared"}
                /\ notCommitted
                /\ rmState' = [rmState EXCEPT ![r] = "aborted"]

TCConsistent == \A r1, r2 \in RM : ~ /\ rmState[r1] = "aborted"
                                     /\ rmState[r2] = "committed"


TCNext == \E r \in RM : Prepare(r) \/ Decide(r)
=============================================================================
