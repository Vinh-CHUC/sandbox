{-# LANGUAGE InstanceSigs #-}
{-# LANGUAGE ScopedTypeVariables #-}
module TypeClasses.Functortown_B_7 (
) where

import Control.Applicative (Applicative (..))
import Test.Hspec (xit, fit)
import Data.Coerce

composePure ::
    (Applicative f1, Applicative f2) =>
    a -> f1 (f2 a)
composePure x = pure (pure x)

composeLiftA2 ::
    (Applicative f1, Applicative f2) =>
    (a -> b -> c) -> f1 (f2 a)
                  -> f1 (f2 b)
                  -> f1 (f2 c)
composeLiftA2 f g h = liftA2 (liftA2 f) g h

newtype ReaderIO env a = ReaderIO (env -> IO a)

instance Functor (ReaderIO env) where
    fmap f (ReaderIO g) = ReaderIO (fmap f . g)
    -- more general: (fmap . fmap) f g

-- Using coerce to write the composed applicative:
instance Applicative (ReaderIO env) where
    pure (x :: a) = coerce g x
        where
            g :: a -> env -> IO a
            g = composePure


    liftA2 (f :: a -> b -> c) = coerce g f
        where
            g :: (a -> b -> c) -> (env -> IO a)
                               -> (env -> IO b)
                               -> (env -> IO c)
            g = composeLiftA2

--------------------------------------------------------------------------------------------
-- Compose yourself: A very generic way to automatically derive Functors and Applicatives --
--------------------------------------------------------------------------------------------

-- Composing terms
compose :: (b -> c) -> (a -> b) -> a -> c
compose f g x = f (g x)

-- Composing types!!!
newtype Compose f g a =
    Compose { getCompose :: f (g a)}

instance (Functor f, Functor g) => Functor (Compose f g) where
    fmap f (Compose x) = Compose ((fmap . fmap) f x)

instance (Applicative f, Applicative g) => Applicative (Compose f g) where
    pure x = Compose ((pure . pure) x)
    liftA2 f (Compose a) (Compose b) = Compose ((liftA2.liftA2) f a b)

-------------------------------------
-- Automatically deriving Functors --
-------------------------------------
-- {-# LANGUAGE DeriveFunctor, DerivingVia #-}

-- import Data.Functor.Compose

-- newtype ReaderIO env a = ReaderIO (env -> IO a)
--     deriving Functor
--     deriving Applicative via Compose ((->) env) IO
