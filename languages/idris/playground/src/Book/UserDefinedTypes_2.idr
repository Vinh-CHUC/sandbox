module Book.UserDefinedTypes_2

import Data.Fin
import Data.Vect

tryIndex : {n: _} -> Integer -> Vect n a -> Maybe a
tryIndex i xs = case integerToFin i n of
                  Nothing => Nothing
                  Just idx => Just $ index idx xs
--------------
-- Exercise --
--------------
data PowerSource = Petrol | Pedal | Electric
data BatteryType = Lithium | Nickel

data Vehicle : PowerSource -> Type where
  Bicycle : Vehicle Pedal
  Unicycle: Vehicle Pedal
  Car : (fuel : Nat) -> Vehicle Petrol
  Bus : (fuel : Nat) -> Vehicle Petrol
  Motorcycle : (fuel : Nat) -> Vehicle Petrol
  Tesla : (battery: BatteryType) -> Vehicle Electric

wheels: Vehicle power -> Nat
wheels Bicycle = 2
wheels (Car fuel) = 4
wheels (Bus fuel) = 4
wheels Unicycle = 1
wheels (Motorcycle fuel) = 4
wheels (Tesla b) = 4

-- Restricing on `Petrol` here effectively restricts the subset of the "type family" that this
-- function can operate on
refuel: Vehicle Petrol -> Vehicle Petrol
refuel (Car fuel) = Car 100
refuel (Bus fuel) = Bus 200
refuel (Motorcycle fuel) = Motorcycle $ fuel * 2

--------------
-- Exercise --
--------------
vectTake : (n: Fin m) -> Vect m  a -> Vect (finToNat n) a
vectTake FZ xs = []
vectTake (FS k) (x :: xs) = x :: vectTake k xs

--------------
-- Exercise --
--------------
sumEntries : Num a => {n: _} -> (pos : Integer) -> Vect n a -> Vect n a -> Maybe a
sumEntries pos xs ys =
  case integerToFin pos n of
    Nothing => Nothing
    Just pos_fin => Just $ index pos_fin xs + index pos_fin ys
