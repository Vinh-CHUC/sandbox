module TypeClasses.Validation8 (
    passwordLength,
    run
) where

import Data.Char
import Data.Validation

newtype Password = 
    Password String deriving (Eq, Show) 

newtype Error = 
    Error [String] deriving (Eq, Show)

newtype Username = 
    Username String deriving (Eq, Show)

instance Semigroup Error where
    Error xs <> Error ys = Error (xs <> ys)

data User = User Username Password
    deriving (Eq, Show)

passwordLength :: String -> Validation Error Password
passwordLength "" = Failure (Error ["Your password cannot be empty"])
passwordLength password = 
    case length password > 20 of
        True -> Failure (Error ["Your password cannot be longer than 20 characters."])
        False -> Success (Password password)

usernameLength :: String -> Validation Error Username
usernameLength username = 
    case length username > 15 of
        True -> Failure (Error ["Your username cannot be longer than 15 characters."])
        False -> Success (Username username)

stripSpace :: String -> Validation Error String
stripSpace "" = Failure (Error ["Your password cannot be empty"])
stripSpace (x:xs) =
    case isSpace x of
        True -> stripSpace xs
        False -> Success (x:xs)

allAlpha :: String -> Validation Error String
allAlpha "" = Failure (Error ["Your password/username cannot be empty"])
allAlpha xs =
    case all isAlphaNum xs of
        False -> Failure (Error ["Your password cannot contain white space or special characters."])
        True -> Success xs

validatePassword :: Password -> Validation Error Password
validatePassword (Password password) = 
    case stripSpace password of
        Failure err -> Failure err
        Success password' ->
            -- *> is basically the same as >> for monads?
            allAlpha password' *> passwordLength password'

validateUsername :: Username -> Validation Error Username
validateUsername (Username username) = 
    case stripSpace username of
        Failure err -> Failure err
        Success username' ->
            allAlpha username' *> usernameLength username'

-- This is the key idea here
-- User takes two args of types Username and Password, but here the validate** return these wrapped
-- in a Error type
makeUser :: Username -> Password -> Validation Error User
makeUser name password =
    User <$> validateUsername name
    <*> validatePassword password

run :: IO ()
run = do
    putStrLn "Please enter a username."
    username <- Username <$> getLine
    putStrLn "Please enter a password."
    -- password <- fmap Password getLine
    -- This <$> notation is the infix version of fmap
    password <- Password <$> getLine
    print (makeUser username password)
