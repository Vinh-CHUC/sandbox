module TypeClasses.Functortown_A_1_intro_to_mapping(
    database, mapToMaybe, mapToEither, greetUser
) where

database :: [(Integer, String)]
database = [(1, "Vinh"), (2, "Chuc")]

_ = lookup 3 database -- => Nothing
_ = lookup 1 database -- -> "Vinh"

mapToMaybe :: (a -> b) -> Maybe a -> Maybe b
mapToMaybe _ Nothing = Nothing
mapToMaybe f (Just s) = Just $ f s

mapToEither :: (a -> b) -> Either l a -> Either l b
mapToEither _f (Left l) = Left l
mapToEither f (Right r) = Right (f r)

greetUser :: Integer -> Maybe String
greetUser record =
    mapToMaybe ("Hello," ++) (lookup record database)
