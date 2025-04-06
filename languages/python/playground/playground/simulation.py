import simpy
from simpy.core import Environment


## Minimal examples
def car(env: Environment):
    while True:
        parking_duration = 5
        yield env.timeout(parking_duration)


##


class Car:
    def __init__(self, env: Environment):
        self.env = env
        self.action = env.process(self.run())

    def run(self):
        while True:
            print("Start parking and chargning %d" % self.env.now)
            charge_duration = 5

            try:
                yield self.env.process(self.charge(charge_duration))
            except simpy.Interrupt:
                print("Was interrupted. Hope, the battery is full enough ...")

            print("Start driving at %d" % self.env.now)
            trip_duration = 2
            yield self.env.timeout(trip_duration)

    def charge(self, duration):
        yield self.env.timeout(duration)


def driver(env: Environment, car: Car):
    yield env.timeout(3)
    car.action.interrupt()


env = simpy.Environment()
car = Car(env)
env.process(driver(env, car))
env.run(until=15)


##
def car2(
    env: Environment, name: str, bcs: simpy.Resource, driving_time, charge_duration
):
    yield env.timeout(driving_time)

    print("%s arriving at %d" % (name, env.now))
    with bcs.request() as req:
        yield req

        print("%s starting to charge at %s" % (name, env.now))
        yield env.timeout(charge_duration)
        print("%s leaving the bcs at %s" % (name, env.now))


env = simpy.Environment()
bcs = simpy.Resource(env, capacity=2)
for i in range(10):
    env.process(car2(env, "Car %d" % i, bcs, i * 2, 5))
env.run()
