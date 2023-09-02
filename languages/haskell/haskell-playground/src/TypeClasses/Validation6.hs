-- ghci> :type (<*>)
-- (<*>) :: Applicative f => f (a -> b) -> f a -> f b
-- ghci> :type (<$>)
-- (<$>) :: Functor f => (a -> b) -> f a -> f b
--
-- If one looks at the Functor f, what if b is itself a a function b -> c?
-- This could naturally happen if one has a function of (a, b) -> c, if you pass a, through
-- currying you get b -> c
module TypeClasses.Validation6 (
    passwordLength,
    run
) where

import Data.Char
import Control.Monad (when)

newtype Password = 
    Password String deriving (Eq, Show) 

newtype Error = 
    Error String deriving (Eq, Show)

newtype Username = 
    Username String deriving (Eq, Show)

data User = User Username Password
    deriving (Eq, Show)

passwordLength :: String -> Either Error Password
passwordLength "" = Left (Error "Your password cannot be empty")
passwordLength password = 
    case length password > 20 of
        True -> Left (Error "Your password cannot be longer than 20 characters.")
        False -> Right (Password password)

usernameLength :: String -> Either Error Username
usernameLength username = 
    case length username > 15 of
        True -> Left (Error "Your username cannot be longer than 15 characters.")
        False -> Right (Username username)

stripSpace :: String -> Either Error String
stripSpace "" = Left (Error "Your password cannot be empty")
stripSpace (x:xs) =
    case isSpace x of
        True -> stripSpace xs
        False -> Right (x:xs)

allAlpha :: String -> Either Error String
allAlpha "" = Left (Error "Your password/username cannot be empty")
allAlpha xs =
    case all isAlphaNum xs of
        False -> Left (Error "Your password cannot contain white space or special characters.")
        True -> Right xs

validatePassword :: Password -> Either Error Password
validatePassword (Password password) = 
    stripSpace password
    >>= allAlpha
    >>= passwordLength

validateUsername :: Username -> Either Error Username
validateUsername (Username username) = 
    stripSpace username
    >>= allAlpha
    >>= usernameLength

makeUser :: Username -> Password -> Either Error User
makeUser name password =
    User <$> validateUsername name
    -- The line above gives a:
    --      Either Error (User Username _)  
    -- The _ indicates that we're missing another argument, hence the applicative comes into play
    <*> validatePassword password
    -- Either Error (User Username Password)

run :: IO ()
run = do
    putStrLn "Please enter a username."
    username <- Username <$> getLine
    putStrLn "Please enter a password."
    -- password <- fmap Password getLine
    -- This <$> notation is the infix version of fmap
    password <- Password <$> getLine
    print (makeUser username password)
