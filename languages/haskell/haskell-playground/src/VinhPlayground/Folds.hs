-- Very good graphical explanation
-- https://www.joachim-breitner.de/various/foldl-foldr-flipped.png
module VinhPlayground.Folds
    (
        myfoldr,
        myfoldl,
    ) where

-- foldr is able to shortcircuit as f has as an operand the sub-problem in the recursion
-- e.g. if f ignores it's right operand depending on the value of the left one (e.g. multiply by 0
-- for example)
-- it's thus suitable for infinite lists!!!! and for infinite lists acc is irrelevant :)
myfoldr :: (a->b->b) -> b -> [a] -> b
myfoldr _f acc [] = acc
myfoldr f acc (x:xs) = f x (myfoldr f acc xs)

-- foldl is "tail recursive", it'll necessarily exhaust the list so it does make it unsuitable for
-- infinite lists and also unable to shortcircuit
-- note that f has as arguments the accumulator or the x, but never the rest of the computation
-- link foldl does
--
-- However if one knows that the list will be traversed entire no matter what, then given the tail
-- recursive nature of foldl it'll be more efficient
--
-- In the haskell stdlib to not have memory overflows you'd have to enforce that (f acc x) is
-- evaluated "strictly", which is what foldl' does
myfoldl :: (b->a->b) -> b -> [a] -> b
myfoldl _f acc [] = acc
myfoldl f acc (x:xs) = myfoldl f (f acc x)  xs