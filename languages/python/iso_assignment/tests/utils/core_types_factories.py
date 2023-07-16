"""
Various factories to help the data generation process. Why generate the "raw" dictionaries rather
than the models themselves? (data_models.py)

In the context of this exercise the data flows from the DB (jsons) to the "domain" types, and then
back to the client.

In an ideal world you'd have factories for each set of types although it would be overkill for this
exercise. Also doing it in this direction allows to exercise deserialisation errors, it wouldn't
have been possible the other way around (unless we don't use python typing).

tl'dr the raw dicts allow to represent more states (e.g. invalid data)
"""
from factory import Factory, fuzzy, LazyFunction
from typing import List
import random
import uuid
from typing import Generic, TypeVar

SENTIMENTS = ["happy", "amused", "sad", "angry", "other"]
T = TypeVar("T")


# Trick to have create() typing compatible
class BaseFactory(Generic[T], Factory):
    @classmethod
    def create(cls, **kwargs) -> T:
        return super().create(**kwargs)


"""
These factories are random by design, it could be an issue if the tests are flawed and do depend on
the random part, tests might then be flaky. To mitigate this:
    - fix the random seed()
    - ensure we print the data to stdout when tests fail
"""


class SentimentFactory(BaseFactory[dict]):
    class Meta:
        model = dict

    sentiment = fuzzy.FuzzyChoice(SENTIMENTS)
    probability = fuzzy.FuzzyFloat(0, 1, precision=2)


# Some arbitraty assumptions about the data
# IRL Models would be very different, there might not be a lower bound when the model is confident
# etc.
P_MODEL_IS_CONFIDENT = 0.3
CONFIDENT_MODEL_LOWER_BOUND = 0.1


def generate_sentiments() -> List[dict]:
    # Given the example output in the instructions (they don't sum to one)
    # I'm assuming each label has its own probability
    ret = []
    for s in SENTIMENTS:
        # Ensuring we have diverse enough data by having frequent "non-confident"
        if random.random() > 0.6:
            ret.append(
                SentimentFactory(
                    sentiment=s,
                    probability=random.uniform(CONFIDENT_MODEL_LOWER_BOUND, 1),
                )
            )

    return ret


class SentimentClassificationFactory(BaseFactory[dict]):
    class Meta:
        model = dict

    modelId = LazyFunction(uuid.uuid4)
    modelName = fuzzy.FuzzyText()
    modelVersion = fuzzy.FuzzyText()
    reviewId = LazyFunction(uuid.uuid4)

    modelOutput = LazyFunction(generate_sentiments)
