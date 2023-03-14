module VinhPlayground.ListMonad
    (
        explodeBasedOnModulo2,
        explodeBasedOnModulo3,
        removeMultiplesOf5,
        test,
        test2,
        test2_2,
        test2_3
    ) where

explodeBasedOnModulo2 :: (Integral a) => a -> [a]
explodeBasedOnModulo2 x
    | even x = [x]
    | odd x  = [x, x]
    | otherwise = []

explodeBasedOnModulo3 :: (Integral a) => a -> [a]
explodeBasedOnModulo3 x
    | mod x 3 == 2 = [x, x, x]
    | mod x 3 == 1 = [x, x]
    | mod x 3 == 0 = [x]
    | otherwise = []

removeMultiplesOf5 :: (Integral a) => a -> [a]
removeMultiplesOf5 x
    | mod x 5 == 0 = []
    | otherwise    = [x]

test :: () -> [Integer]
test () =
    [1..10] >>= explodeBasedOnModulo2 >>= explodeBasedOnModulo3

test2 :: Integer -> [Integer]
test2 x = do
    y <- explodeBasedOnModulo2 x
    z <- explodeBasedOnModulo3 y
    removeMultiplesOf5 z

test2_2 :: Integer -> [Integer]
test2_2 x =
    explodeBasedOnModulo2 x >>=
        explodeBasedOnModulo3 >>= 
            removeMultiplesOf5

test2_3 :: Integer -> [Integer]
test2_3 x = 
    explodeBasedOnModulo2 x >>=
        explodeBasedOnModulo3 >>= 
            removeMultiplesOf5
