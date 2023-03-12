module VinhPlayground.StateBasic
    (
        monday,
        tuesday,
        luckyPair,
        TurnstileState(..),
        TurnstileOutput(..),
    ) where

data TurnstileState = Locked | Unlocked
    deriving (Eq, Show)
data TurnstileOutput = Thanks | Open | Tut
    deriving (Eq, Show)

-- The state processors, a.k.a. s -> (a, s)
-- Can also be seen as "input" or "events"
-- input state = output state
coin, push :: TurnstileState -> (TurnstileOutput, TurnstileState)

coin _ = (Thanks, Unlocked)

push Locked = (Tut, Locked)
push Unlocked = (Open, Locked)

monday :: TurnstileState -> ([TurnstileOutput], TurnstileState)
monday s0 =
    -- Simple case
    -- The outputs (a's) aren't used for further computations
    let (a1, s1) = coin s0
        (a2, s2) = push s1
        (a3, s3) = push s2
        (a4, s4) = coin s3
        (a5, s5) = push s4
    in ([a1, a2, a3, a4, a5], s5)

regularPerson, distractedPerson, hastyPerson :: TurnstileState -> ([TurnstileOutput], TurnstileState)

regularPerson s0 = 
    let (a1, s1) = coin s0
        (a2, s2) = push s1
    in ([a1, a2], s2)


distractedPerson s0 =
    let (a1, s1) = coin s0
    in ([a1], s1)

hastyPerson s0 =
    let (a1, s1) = push s0
    -- Output is used for subsequent steps here
    in case a1 of 
        Open -> ([a1], s1)
        _ ->
            let (a2, s2) = coin s1
                (a3, s3) = push s2
            in ([a1, a2, a3], s3)

tuesday :: TurnstileState -> ([TurnstileOutput], TurnstileState)
tuesday s0 =
    let (as1, s1) = regularPerson s0
        (as2, s2) = hastyPerson s1
        (as3, s3) = distractedPerson s2
        (as4, s4) = hastyPerson s3
    in (as1 ++ as2 ++ as3 ++ as4, s4)

luckyPair :: Bool -> TurnstileState -> (Bool, TurnstileState)
luckyPair personChoice s0 =
    let firstPerson = if personChoice then regularPerson else distractedPerson
        (_, s1) = firstPerson s0
        (a2, s2) = push s1
    in
        (a2 == Open, s2)
