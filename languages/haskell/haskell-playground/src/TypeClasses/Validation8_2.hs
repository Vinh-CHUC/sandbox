-- My own spin on top of validation course, wanted to have more explicit types
module TypeClasses.Validation8_2 (
    run,
    display,
) where

import Data.Coerce
import Data.Char
import Data.Validation
newtype Password =
    Password String deriving (Eq, Show) 

data Error = PasswordError String | UsernameError String deriving (Eq, Show)

newtype Errors = Errors [String] deriving (Eq, Show)
newtype TypedErrors = TypedErrors [Error] deriving (Eq, Show)
newtype Username = 
    Username String deriving (Eq, Show)

instance Semigroup Errors where
    Errors xs <> Errors ys = Errors (xs <> ys)
instance Semigroup TypedErrors where
    TypedErrors xs <> TypedErrors ys = TypedErrors (xs <> ys)

data User = User Username Password
    deriving (Eq, Show)

validateLength :: String -> Int -> Validation Errors String
validateLength "" _ = Failure (Errors ["Cannot be empty"])
validateLength s l = 
    if length s > l
        then Failure (Errors ["Cannot be longer than " ++ show l ++  " characters."])
        else Success s

stripSpace :: String -> Validation Errors String
stripSpace "" = Failure (Errors ["Cannot be left blank"])
stripSpace (x:xs) =
    if isSpace x
        then stripSpace xs
        else Success (x:xs)

allAlpha :: String -> Validation Errors String
allAlpha "" = Failure (Errors ["Cannot be empty"])
allAlpha xs =
    if all isAlphaNum xs
        then Success xs
        else Failure (Errors ["Cannot contain white space or special characters."])

-------------------------

-- Using coerce in this function (similar to from/to in Rust)
validatePassword :: Password -> Validation TypedErrors Password
validatePassword password = 
    -- We can't chain all the 3 checks here as allAlpha and passwordLength depend on the stripped
    -- version of password (aka password')
    -- We could have used monads instead?
    let x = case stripSpace $ coerce password of
                Failure err -> Failure err
                Success password' ->
                    -- *> is basically the same as >> for monads?
                    allAlpha password' *> validateLength password' 15
    in case x of
        Success s -> Success (coerce s)
        Failure (Errors errs) -> Failure (TypedErrors (fmap PasswordError errs))

validateUsername :: Username -> Validation TypedErrors Username
validateUsername (Username username) = 
    let x = case stripSpace username of
                Failure err -> Failure err
                Success username' ->
                    -- *> is basically the same as >> for monads?
                    allAlpha username' *> validateLength username' 20
    in case x of
        Success s -> Success (Username s)
        Failure (Errors errs) -> Failure (TypedErrors (fmap UsernameError errs))

-- This is the key idea here
-- User takes two args of types Username and Password, but here the validate** return these wrapped
-- in a Error type
makeUser :: Username -> Password -> Validation TypedErrors User
makeUser name password =
    -- A philosophical thought Error could be a list of union between UsernameError and PasswordError
    -- It'd make this slightly more sophisticated
    User <$> validateUsername name <*> validatePassword password

display :: Username -> Password -> IO ()
display name password = 
    case makeUser name password of
        Failure (TypedErrors errs) ->
            putStrLn (
                unlines (
                    fmap (
                        \x -> case x of
                            PasswordError pe -> "Password error:" ++ pe
                            UsernameError ue -> "Username error:" ++ ue
                    )
                    errs
                )
            )
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
