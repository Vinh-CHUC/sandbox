-- Map is not a valid instance of Applicative
module TypeClasses.Functortown_B_8 (
    names
) where

import Data.Map()

names :: [(Integer, String)]
names =
    [
        (1, "Julie"),
        (3, "Chris"),
        (4, "Alonzo")
    ]

-- Can we define a pure for Map k? (ie the \x -> Map k x)
-- Not really we'd have to choose random key value???
--
-- First applicative identity:
-- - pure id <*> v = v
--
-- If we choose <*> as "intersectionWith", there is no way to have that first identity verififed!
