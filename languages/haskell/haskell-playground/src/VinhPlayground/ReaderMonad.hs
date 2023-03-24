module VinhPlayground.ReaderMonad
    (
        test,
        test2,
    ) where

appendToEnv :: String -> String -> String
appendToEnv s env = env ++ s

describesLengthOfTheEnvironment :: String -> String -> String
describesLengthOfTheEnvironment s env = s ++ show (length env)

test :: (String -> [String])
test =
    appendToEnv "I am some suffix" >>=
        (\x -> describesLengthOfTheEnvironment "The length of the environment is " >>=
            (\y -> return [x, y]))

test2 :: (String -> [String])
test2 = do
    x <- appendToEnv "I am some suffix" 
    y <- describesLengthOfTheEnvironment "The length of the environment is "
    return [x, y]
