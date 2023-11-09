-- Map is not a valid instance of Applicative
module TypeClasses.Functortown_B_8 (
) where

import Data.Map (Map)
import qualified Data.Map as Map

names :: [(Integer, String)]
names =
    [
        (1, "Julie"),
        (3, "Chris"),
        (4, "Alonzo")
    ]
