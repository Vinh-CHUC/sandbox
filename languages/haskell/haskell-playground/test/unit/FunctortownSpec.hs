module FunctortownSpec where

import Data.Bifunctor
import Test.Hspec
import Test.QuickCheck

import TypeClasses.Functortown_A_7

spec :: Spec
spec = do
    describe "Functor Law" $ do
        it "Functor composition" $ do
            property $ \a b ->
                fmap ((+1).(*100)) [a :: Int, b :: Int] == ((fmap (+1)).(fmap (*100))) [a, b]
    describe "Bifunctor Laws" $ do
        it "Tuple identify law" $ do
            property $ \a b ->
                bimap id id (a :: Char, b :: Int) == id (a, b)
        it "These bifunctor law law" $ do
            property $ \a b ->
                    bimap (+5) (*3) (These (a :: Int) (b :: Int)) ==
                        (second (*3) . first (+5)) (These a b)
                    &&
                    bimap (+5) (*3) (These a b) ==
                        (first (+5) . second (*3)) (These a b)
                    &&
                    bimap (+5) (*3) (This a) ==
                        (first (+5) . second (*3)) (This a)
                    &&
                    bimap (+5) (*3) (That b) ==
                        (first (+5) . second (*3)) (That b)
