module Hithere.Lib2
    ( 
        someFunc,
        doubleMe
    ) where

someFunc :: IO ()
someFunc = putStrLn "someFunc"

doubleMe :: Num a => a -> a
doubleMe x = x + x
