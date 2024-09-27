module ToyParserSpec (spec) where

import Test.Hspec

import VinhPlayground.ToyParser

type ParserOutput = Either [Error Char ()] (Char, String)

spec :: Spec
spec = do
  describe "Satisfy" $ do
    it "Basics" $ do
      runParser (satisfy (== 'a')) "ab" `shouldBe` (Right ('a', "b") :: ParserOutput)
      runParser (satisfy (== 'b')) "ab" `shouldBe` (Left [Unexpected 'a'] :: ParserOutput)
      runParser (satisfy (== 'b')) "" `shouldBe` (Left [EndOfInput] :: ParserOutput)
  describe "Char" $ do
    it "Basics" $ do
      runParser (char 'a') "ab" `shouldBe` (Right ('a', "b") :: ParserOutput)
