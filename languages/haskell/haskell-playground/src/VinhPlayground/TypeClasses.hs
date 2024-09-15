{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE FunctionalDependencies #-}
{-# LANGUAGE FlexibleInstances #-}
module VinhPlayground.TypeClasses (
    Extract(..)
) where

class Extract container elem | container -> elem where
    extract :: container -> elem

--------------
-- Conflict --
--------------
instance Extract (Int, Int) Int where
    extract (x, _) = x

-- This instance and the one above do conflict
-- instance Extract (Int, Int) Bool where
--     extract (_, x) = True

--------------------
-- No Conflict !! --
--------------------
instance Extract (a, b) a where
    extract (x, _) = x

instance Extract (a, b) b where
    extract (_, x) = x

--------------
-- Conflict --
--------------
-- instance Extract (a, a) Bool where
--     extract (_, _) = True

-- instance Extract (a, a) Char where
--     extract (_, _) = 'a'
