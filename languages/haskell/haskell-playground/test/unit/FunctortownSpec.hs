module FunctortownSpec where

import Test.Hspec
import Test.QuickCheck

spec :: Spec
spec = do
    describe "Functor Law" $ do
        it "Functor composition" $ do
            property $ \a b ->
                fmap ((+1).(*100)) [a :: Int, b :: Int] == ((fmap (+1)).(fmap (*100))) [a, b]
