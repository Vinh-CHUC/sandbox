module Book.UserDefinedTypes_InteractiveDataStore

import Data.Vect
import Data.String
import System.REPL

---------------
-- DataStore --
---------------
data DataStore : Type where
  MkData : (size : Nat) -> (items : Vect size String) -> DataStore

size : DataStore -> Nat
size (MkData size' items') = size'

items : (store : DataStore) -> Vect (size store) String
items (MkData size' items') = items'

addToStore : DataStore -> String -> DataStore
addToStore (MkData size items) newitem = MkData _ (addToData items)
  where
    addToData : Vect old String -> Vect (S old) String
    addToData [] = [newitem]
    addToData (x :: xs) = x :: addToData xs

--------------
-- Commands --
--------------
data Command = Add String | Get Integer | Quit

parseCommand : String -> String -> Maybe Command
parseCommand "add" str = Just (Add str)
parseCommand "get" val = case all isDigit (unpack val) of
                              False => Nothing
                              True => Just (Get (cast val))
parseCommand "quit" "" = Just Quit
parseCommand _ _ = Nothing

parse : (input : String) -> Maybe Command
parse input = 
  case span (/= ' ') input of
    (cmd, args) => parseCommand cmd (ltrim args)

processCommand : Command -> DataStore -> Maybe (String, DataStore)
processCommand (Add str) ds = Just ("ID " ++ cast (size ds) ++ "\n", addToStore ds str)
processCommand (Get i) ds = 
  case integerToFin i (size ds) of
       Nothing => Just("Out of range", ds)
       Just idx => Just(index idx $ items ds, ds)
processCommand Quit y = Nothing


processInput : DataStore -> String -> Maybe (String, DataStore)
processInput store str =
  case parse str of
       Nothing => Just ("Invalid Command \n", store)
       Just cmd => processCommand cmd store

-- replWith : HasIO io => a -> String -> (a -> String -> Maybe (String, a)) -> io()
main : IO ()
main = replWith (MkData _ []) "Command: " processInput
