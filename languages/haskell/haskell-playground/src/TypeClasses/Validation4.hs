module TypeClasses.Validation4
    (
        maxLength,
        allAlpha,
        stripSpace,
        validate,
        validateM,
        run,
    ) where

import Data.Char

maxLength :: String -> Maybe String
maxLength "" = Nothing
maxLength xs =
    case length xs > 20 of
        True -> Nothing
        False -> Just xs

allAlpha :: String -> Maybe String
allAlpha "" = Nothing
allAlpha xs =
    case all isAlphaNum xs of
        False -> Nothing
        True -> Just xs

stripSpace :: String -> Maybe String
stripSpace "" = Nothing
stripSpace (x:xs) =
    case isSpace x of
        True -> stripSpace xs
        False -> Just (x:xs)



validate :: String -> Maybe String
validate x =
    case stripSpace x of
        Nothing -> Nothing
        Just x1 -> case allAlpha x1 of
            Nothing -> Nothing
            Just x2 -> case maxLength x2 of
                Nothing -> Nothing
                Just x3 -> Just x3

validateM :: String -> Maybe String
validateM x = 
    stripSpace x >>= allAlpha >>= maxLength
            
run :: IO ()
run = do
    putStrLn "Please enter a password."
    password <- getLine
    print (validate password)
