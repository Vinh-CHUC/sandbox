module ToyParserSpec (spec) where

import Test.Hspec
import VinhPlayground.ToyParser

type ParserOutput t = Either [Error Char ()] (t, String)

spec :: Spec
spec = do
  describe "Satisfy" $ do
    it "Basics" $ do
      runParser (satisfy (== 'a')) "ab" `shouldBe` (Right ('a', "b") :: ParserOutput Char)
      runParser (satisfy (== 'b')) "ab" `shouldBe` (Left [Unexpected 'a'] :: ParserOutput Char)
      runParser (satisfy (== 'b')) "" `shouldBe` (Left [EndOfInput] :: ParserOutput Char)
  describe "Char" $ do
    it "Basics" $ do
      runParser (char 'a') "ab" `shouldBe` (Right ('a', "b") :: ParserOutput Char)
  describe "String" $ do
    it "Basics" $ do
      runParser (string "ab") "ab" `shouldBe` (Right ("ab", "") :: ParserOutput String)
