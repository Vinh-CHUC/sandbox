--------------------------- MODULE diehard ---------------------------
EXTENDS Naturals

VARIABLE big, small

vars == << big, small >>

Init == /\ big = 0
        /\ small = 0

FillBig   == /\ big' = 5
             /\ small' = small

FillSmall == /\ big' = big
             /\ small' = 3

EmptyBig   == /\ big' = 0
              /\ small' = small

EmptySmall == /\ big' = big
              /\ small' = 0

PourBigIntoSmall ==
    /\ big'   = IF big + small =< 3 THEN 0 ELSE big - (3 - small)
    /\ small' = IF big + small =< 3 THEN big + small ELSE 3

PourSmallIntoBig ==
    /\ small' = IF big + small =< 5 THEN 0 ELSE small - (5 - big)
    /\ big'   = IF big + small =< 5 THEN big + small ELSE 5

(*
A variant of the one above
Where the IF is not really an expression but rather will yield a block
a relations
*)
PourSmallIntoBig2 ==
    IF big + small =< 5
    THEN /\ big' = big + small
         /\ small' = 0
    ELSE /\ big' = 5
         /\ small' = small - (5 - big)

Next == \/ FillBig
        \/ FillSmall
        \/ EmptyBig
        \/ EmptySmall
        \/ PourBigIntoSmall
        \/ PourSmallIntoBig

NotSolved == big # 4

Spec == Init /\ [][Next]_vars

=============================================================================
