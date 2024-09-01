module FunctortownSpec (spec) where

import Data.Bifunctor
import Data.Set()
import Test.Hspec
import Test.QuickCheck

import TypeClasses.Functortown_A_7_bifunctor_laws
import TypeClasses.Functortown_B_10_applicative_laws


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
                    bimap (+(5 :: Int)) (*(3 :: Int)) (This a) ==
                        (first (+5) . second (*3)) (This a)
                    &&
                    bimap (+(5 :: Int)) (*3) (That b) ==
                        (first (+5) . second (*3)) (That b)
    describe "Applicative Laws" $ do
        it "Respects identity law" $ do
            property $ \fantastic ->
                (pure id <*> (fantastic :: Fantastic Int))
                    == fantastic
        it "Respects the homomorphism law" $ do
            property $ \testfn a ->
                (pure (applyTestFunction testfn) <*> pure a)
                    == (pure (applyTestFunction testfn a) :: Fantastic Int)
        -- it "Respects the interchange law" $ do
        --     property $ \testfn a ->
        --         (pure (applyTestFunction testfn) <*> pure a) :: Fantastic Int
        --             == ((
        --                 pure ($ a)
        --                 <*>
        --                 pure (applyTestFunction testfn)
        --             ) :: Fantastic Int)
