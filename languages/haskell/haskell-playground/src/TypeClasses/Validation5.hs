module TypeClasses.Validation5 (
    maxLength,
    allAlpha,
    stripSpace,
    run
) where

import Data.Char

maxLength :: String -> Either String String
maxLength "" = Left "Your password cannot be empty"
maxLength xs =
    case length xs > 20 of
        True -> Left "Your password cannot be longer than 20 characters."
        False -> Right xs

allAlpha :: String -> Either String String
allAlpha "" = Left "Your password cannot be empty"
allAlpha xs =
    case all isAlphaNum xs of
        False -> Left "Your password cannot contain white space or special characters."
        True -> Right xs

stripSpace :: String -> Either String String
stripSpace "" = Left "Your password cannot be empty"
stripSpace (x:xs) =
    case isSpace x of
        True -> stripSpace xs
        False -> Right (x:xs)


validatePassword :: String -> Either String String
validatePassword password =
    stripSpace password
    >>= maxLength
    >>= allAlpha

run :: IO ()
run = do
    putStrLn "Please enter a password."
    password <- getLine
    print (validatePassword password)
