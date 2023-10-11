module TypeClasses.Functortown_B_3 (
) where
import GHC.Arr (thawSTArray)

-- (*>) :: f a -> f b -> f b
-- (<*) :: f a -> f b -> f a

-- Revisiting the Validation package
-- 
-- Validation is ~"Either with Semigroup constraint on the error value"
-- Notice that
--
-- Failure "Err1" *> Failure "Err2" returns Failure "Err1 Err2"
-- and does not short circuit!!!
