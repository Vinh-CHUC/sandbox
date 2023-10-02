module TypeClasses.Validation8 (
    passwordLength,
    run,
    display,
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
stripSpace "" = Failure (Error ["Cannot be left blank"])
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
    -- We can't chain all the 3 checks here as allAlpha and passwordLength depend on the stripped
    -- version of password (aka password')
    -- We could have used monads instead?
    case stripSpace password of
        Failure err -> Failure err
        Success password' ->
            -- *> is basically the same as >> for monads?
            allAlpha password' *> passwordLength password'

validateUsername :: Username -> Validation Error Username
validateUsername (Username username) = 
    -- We can't chain all the 3 checks here as allAlpha and passwordLength depend on the stripped
    -- version of password (aka password')
    -- We could have used monads instead?
    case stripSpace username of
        Failure err -> Failure err
        Success username' ->
            allAlpha username' *> usernameLength username'

passwordErrors :: Password -> Validation Error Password
passwordErrors password =
    case validatePassword password of
        Failure err -> Failure((Error ["Invalid password: "]) <> err)
        Success password' -> Success password'

usernameErrors :: Username -> Validation Error Username
usernameErrors username =
    case validateUsername username of
        Failure err -> Failure ((Error ["Invalid username: "]) <> err)
        Success name -> Success name

-- This is the key idea here
-- User takes two args of types Username and Password, but here the validate** return these wrapped
-- in a Error type
makeUser :: Username -> Password -> Validation Error User
makeUser name password =
    -- A philosophical thought Error could be a list of union between UsernameError and PasswordError
    -- It'd make this slightly more sophisticated
    User <$> usernameErrors name
    <*> passwordErrors password


errorCoerce :: Error -> [String]
errorCoerce (Error err) = err

display :: Username -> Password -> IO ()
display name password = 
    case makeUser name password of
        Failure err -> putStrLn (unlines (errorCoerce err))
        Success (User (Username name') _) -> putStrLn("Welcome, " ++ name')

run :: IO ()
run = do
    putStrLn "Please enter a username."
    username <- Username <$> getLine
    putStrLn "Please enter a password."
    -- password <- fmap Password getLine
    -- This <$> notation is the infix version of fmap
    password <- Password <$> getLine
    putStrLn ""
    display username password
