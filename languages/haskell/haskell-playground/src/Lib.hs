module Lib
    ( 
        someFunc,
        doubleMe
    ) where

someFunc :: IO ()
someFunc = putStrLn "someFunc"

doubleMe :: Num a => a -> a
doubleMe x = x + x
