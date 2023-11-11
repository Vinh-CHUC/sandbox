{-# LANGUAGE InstanceSigs #-}

module TypeClasses.Functortown_B_5 (
) where
import Control.Lens (cons)
import Control.Applicative

-- Qui l'eut cru?
-- instance Functor ((->) a) where
--   fmap :: (a -> b) -> ((->) w) a -> ((->) w) b
--   fmap ab wa = (.)

-- Meditate on the Applicative functions for ((->) _)
-- pure @((->) _) :: a -> w -> a
-- liftA2 @((->) _) :: (a -> b -> c) -> (w -> a) -> (w -> b) -> w -> c
-- (<*> @(-> _)) :: (w -> a -> b) -> (w -> a) -> w -> b

functionPure :: a -> w -> a
functionPure = const

functionLiftA2 :: (a -> b -> c) -> (w -> a) -> (w -> b) -> w -> c
functionLiftA2 f g h x = f (g x) (h x)

-- Exercise
functionAp :: (w -> a -> b) -> (w -> a) -> w -> b
functionAp f g x = f x (g x)

-- The Reader :)
newtype Reader env a = Reader { runReader :: env -> a }

instance Functor (Reader env) where
    fmap :: (a -> b) -> Reader env a -> Reader env b
    fmap f (Reader a) = Reader $ f . a

_ = runReader (fmap (+1) (Reader (+2))) 5

instance Applicative (Reader e) where
    pure :: a -> Reader env a
    pure a = Reader (const a)

    liftA2 :: (a -> b -> c) -> (Reader env a) -> (Reader env b) -> (Reader env c)
    liftA2 f (Reader a) (Reader b) = Reader (\x -> f (a x) (b x))

    (<*>) :: Reader env (a -> b) -> Reader env a -> Reader env b
    (<*>) (Reader f) (Reader g) = Reader (\x -> f x (g x))



assembleMessage :: String -> String -> String -> String
assembleMessage salutation pitch closing =
    salutation ++ "\n\n" ++ pitch ++ "\n\n" ++ closing

personalizedSalutation :: String -> String
personalizedSalutation name = "Hello " ++ name ++ ","

personalizedPitch :: String -> String
personalizedPitch name = "I have been looking at your work, " ++ name ++
    ", and I have an opportunity in the Bay Area that seems right up your alley."

genericClosing = "- Recruiter"

personalizedMessage :: Reader String String
personalizedMessage =
    pure assembleMessage
        <*> Reader personalizedSalutation
        <*> Reader personalizedPitch
        <*> pure genericClosing

messageForVinh = runReader personalizedMessage "Vinh"
