module Tapl.UntypedArithExprSpec (spec) where

import Test.Hspec
import Text.Megaparsec
import Tapl.UntypedArithExpr.Parser

spec :: Spec
spec = do
  describe "Parser" $ do
    it "parses values" $ do
      parseMaybe atom "true" `shouldBe` Just (TValue VTrue)
      parseMaybe atom "false" `shouldBe` Just (TValue VFalse)
      parseMaybe atom "0" `shouldBe` Just (TValue VZero)
    it "parses ifs" $ do
      parseMaybe atom "if true then 0 else false"
      `shouldBe`
      Just (TIf $ If {icond = TValue VTrue, ithen = TValue VZero, ielse = TValue VFalse})
