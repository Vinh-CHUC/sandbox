{-# LANGUAGE LambdaCase, OverloadedStrings, TypeApplications #-}

module TypeClasses.TweetHistory_Refactor (
    mainfn
) where


import qualified Data.ByteString.Lazy as Bs
import qualified Data.Csv as Csv
import qualified Data.Map as Map
import qualified Data.Text as Text
import qualified Data.Time as Time

import Control.Monad (mfilter, (<=<))
import Data.Foldable (toList, traverse_)
import Data.List.NonEmpty (NonEmpty)
import Data.Map (Map)
import Data.Maybe (mapMaybe)
import Data.Text (Text)
import Data.Time (Day)
import Data.Validation (Validation (..), validation)
import Data.Vector (Vector)
import Data.Function()

-- Reads a CSV file, prints a histogram of all days I've tweeted at Julie.
-- If any rows fail to parse, prints a list of failed rows instead.
mainfn :: IO ()
mainfn = withInput (printOutput . processData)

-- A row of input from the CSV file
type Row = Map Text Text

-- Rows that are unreadable due to some error
type Problems = NonEmpty Row

-- Runs the continuation with the CSV parse result, or prints an error.
--
-- Example of the continuation style, for this to make sense note that the continue is not used on
-- all the return paths. Otherwise one could instead just compose
withInput :: (Vector Row -> IO ()) -> IO ()
withInput continue =
    readBytes >>= decode >>= failOrContinue
  where
    readBytes = Bs.readFile "tweets.csv"
    decode bs = pure $
        fmap (\(_header, rows) -> rows) $
            Csv.decodeByName bs
    failOrContinue = \case
        Left err -> putStrLn err
        Right rows -> continue rows

-- Turns the CSV data into a histogram of Julie interactions.
processData :: Vector Row -> Validation Problems [(Range, Int)]
processData = fmap (generateHistogram . findJulieDays) . interpretRows

-- Reads the relevant information from the CSV data,
-- or fails with a list of rows that could not be read.
interpretRows :: Vector Row -> Validation Problems [(Day, Text)]
interpretRows = traverse interpretOneRow . toList

-- Reads the relevant information from one row of CSV data,
-- or fails with the row as the error value.
interpretOneRow :: Row -> Validation Problems (Day, Text)
interpretOneRow row =
    maybe (oneProblem row) Success $
        readTweet row

-- A failure value indicating that the given row could not be read.
oneProblem :: Row -> Validation Problems a
oneProblem row = Failure (pure @NonEmpty row)

-- Tries to get the relevant information from a row of CSV data.
readTweet :: Row -> Maybe (Day, Text)
readTweet row =
  do
    day <- readDay row
    text <- readText row
    pure (day, text)

-- Tries to get the day a tweet was sent.
readDay :: Row -> Maybe Day
readDay = parseDay <=< Map.lookup "timestamp"

-- Tries to get the text of a tweet.
readText :: Row -> Maybe Text
readText = Map.lookup "text"

-- Given a list of tweets, returns a list containing
-- one item for each tweet that mentions Julie.
findJulieDays :: [(Day, Text)] -> [Day]
findJulieDays = mapMaybe $ \(day, text) ->
    if ("@argumatronic" `Text.isInfixOf` text)
    then Just day else Nothing

-- Given a list of events, groups them into ranges to produce a histogram.
generateHistogram :: [Day] -> [(Range, Int)]
generateHistogram julieDays = hist xs f
  where
    xs :: [Range]
    xs = ranges julieDays -- The histogram has a line for each date range.

    -- Each line shows a count of the number of Julie tweets in the range.
    f :: Range -> Int
    f x = count (inRange x) julieDays

-- Very general function for constructing a histogram.
hist ::
    [x]          -- ^ The histogram labels
    -> (x -> y)  -- ^ A function that maps each histogram label
                 --   to its corresponding numeric value
    -> [(x, y)]

hist xs f = zip xs (map f xs)

-- Displays the total output of the program, be it good or bad.
printOutput :: Validation Problems [(Range, Int)] -> IO ()
printOutput = validation printFailure printSuccess

-- Produces the program's output in the event that some rows
-- couldn't be read.
printFailure :: Problems -> IO ()
printFailure problems =
  do
    putStrLn "Problematic rows:"
    traverse_ (\row -> putStrLn (" ● " <> show row)) problems

-- Displays the histogram data that results from a successful
-- run of the program.
printSuccess :: [(Range, Int)] -> IO ()
printSuccess = traverse_ $ \((start, _end), n) ->
    putStrLn (show start <> " " <> show n)

-- A range is a series of consecutive days.
type Range = (Day, Day)

-- A range includes the start day, and all consecutive
-- days up to (but not including) the end day.
inRange :: (Day, Day) -> Day -> Bool
inRange (start, end) x = (x >= start) && (x < end)

-- Determines whether a range begins *after* a particular day.
rangeIsAfter :: Day -> (Day, Day) -> Bool
rangeIsAfter x (start, _end) = start > x

-- A list of consecutive ranges that altogether encompass all the days.
ranges :: Foldable f => f Day -> [Range]
ranges days = takeUntil (rangeIsAfter lastDay) (iterate nextRange firstRange)
  where
    firstDay, lastDay :: Day
    firstDay = minimum days
    lastDay = maximum days

    -- A range that begins on a given start day.
    range :: Day -> Range
    range start = (start, end) where end = Time.addDays 10 start

    firstRange :: Range
    firstRange = range firstDay

    -- Given one range, produce the next one that immediately follows it.
    -- The end day of the input range is the start day of the next range.
    nextRange :: Range -> Range
    nextRange (_, end) = range end

-- The longest list prefix of items *not* satisfying the predicate.
takeUntil :: (a -> Bool) -> [a] -> [a]
takeUntil f = takeWhile (not . f)

-- The number of items in the list that satisfy the predicate.
count :: Foldable f => (a -> Bool) -> f a -> Int
count f xs = length (mfilter f (toList xs))

-- Tries to read a timestamp from the CSV data as a `Day`.
parseDay :: Text -> Maybe Day
parseDay = parse . Text.unpack
  where
    parse = Time.parseTimeM allowSpaces locale format
    allowSpaces = False
    locale = Time.defaultTimeLocale
    format = "%Y-%m-%d %H:%M:%S %z"
