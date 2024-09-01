module ListMonadSpec (spec) where

import VinhPlayground.ListMonad as S
import Test.Hspec

spec :: Spec
spec = do
    describe "State monad" $ do
        it "Basics" $ do
            S.test2 [1, 2, 3, 4] `shouldBe` [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4]
