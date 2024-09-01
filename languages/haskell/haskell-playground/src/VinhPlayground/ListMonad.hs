{-# LANGUAGE FlexibleContexts #-}

module VinhPlayground.ListMonad
    (
        explodeBasedOnModulo2,
        explodeBasedOnModulo3,
        removeMultiplesOf5,
        test,
        test2,
        test2_1,
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

test2 :: [Integer] -> [Integer]
test2 xs = do
    x <- xs
    y <- explodeBasedOnModulo2 x
    z <- explodeBasedOnModulo3 y
    removeMultiplesOf5 z

test2_1 :: Integer -> [Integer]
test2_1 x = explodeBasedOnModulo2 x

test2_2 :: Integer -> [Integer]
test2_2 x =
    explodeBasedOnModulo2 x >>=
        (\y -> explodeBasedOnModulo3 y)

test2_3 :: Integer -> [Integer]
test2_3 x =
    explodeBasedOnModulo2 x >>=
        -- Could add more brackets (\y -> ( but they are redundant
        (\y ->explodeBasedOnModulo3 y >>=
            (\z -> removeMultiplesOf5 z))
