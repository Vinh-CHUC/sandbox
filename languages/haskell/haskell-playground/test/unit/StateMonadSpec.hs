module StateMonadSpec (spec) where

import VinhPlayground.StateBasic as S
import Test.Hspec

spec :: Spec
spec = do
    describe "State monad" $ do
        it "luckyPair" $ do
            S.luckyPair False S.Locked `shouldBe` (True, S.Locked)
            S.luckyPair False S.Unlocked `shouldBe` (True, S.Locked)
            S.luckyPair True S.Locked `shouldBe` (False, S.Locked)
            S.luckyPair True S.Unlocked `shouldBe` (False, S.Locked)
