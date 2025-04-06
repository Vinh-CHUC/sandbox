####################
## Sending values ##
####################

from types import prepare_class


def my_generator():
    for i in range(10):
        print(f"from generator {yield i}")


gen = my_generator()

# Will return 0 BUT generator will not print yet
# This is because after this line executes, the yield has sent the value to the caller of send()
# but the print() hasn't been called yet

# returns the first value passed into yield inside generator
# generator is now blocked waiting to evaluate the yield#0
gen.send(None)  # => 0
# the yield expression inside generator evaluates to 1, generator is not "stuck just after yield 2"
# waiting for the next value to be sent
gen.send(1)  # => 1


# gen.send(..)                           yield#1 yields
# gen.send(x1) yield#1 evaluates to x1 | yield#2 yields
# gen.send(x2) yield#2 evaluates to x2 | yield#3 yields
# gen.send(x3) yield#3 evaluates to x3 | yield#4 yields

# An odd design choice... I guess it's because otherwise the generator would have to "hold onto"
# the sent value until the next send().
# - The intended semantics is such that when one sends(something) the
# something has to be immediately passed in the generator to become the result of the yield
# expression, so it has to be waiting already.
# - Another way to phrase it is first the generator yields, then it receives the sent value!
#
# Another approach would have been for the first send to do another loop "upfront" and block just
# before the second call to yield?
# BUT! This would not work with things that only yield once, as we need to preseve this concept
# of stopiteration


def my_generator_2():
    yield 42


############
## islice ##
############


def my_generator_3():
    while True:
        print("hi there")
        yield "hello"


## Accumulate
def accumul_rec(arr):
    match arr:
        case []:
            return 0
        case [x]:
            return [x]
        case [*rest, last]:
            temp = accumul(rest)
            return temp + [temp[-1] + last]


def accumul_it(arr):
    if not arr:
        return 0
    ret = []

    for idx, el in enumerate(arr):
        if idx == 0:
            ret.append(el)
        else:
            ret.append(el + ret[-1])
    return ret
