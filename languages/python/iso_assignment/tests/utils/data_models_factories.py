from factory import Factory, fuzzy, LazyFunction, SubFactory
from data_models import Sentiment  # replace with actual module where Sentiment is defined
import uuid

enum 


class SentimentFactory(Factory):
    class Meta:
        model = dict

    sentiment = fuzzy.FuzzyChoice(["happy", "angry", "neutral"])
    probability = fuzzy.FuzzyFloat(0, 1, precision=2)


class SentimentClassificationFactory(Factory):
    class Meta:
        model = dict

    modelID = LazyFunction(uuid.uuid4)
    modelName = fuzzy.FuzzyText()
    modelVersion = fuzzy.FuzzyText()
    reviewId = LazyFunction(uuid.uuid4)

    modelOutput = LazyFunction(lambda: [SentimentFactory() for _ in range(5))


# With numpy it'd be faster/more idiomatic to generate random stuff but a bit overkill for this
RAND_INTS = [random.randint(0, 100) for _ in range(10)] + [0] * 5 + [100] * 5 


def generate_sentiments():
    # Didn't bother to attempt to generate number that would not add-up to 1, but the check is
    # present in the SentimentClass itself

