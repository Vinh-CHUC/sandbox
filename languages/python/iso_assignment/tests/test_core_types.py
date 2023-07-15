"""
At the moment the tests guarantee that the factories are compatible with the core types, in the
sense that python doesn't throw at runtime

As mentioned in core_types.py, if I had more time I would have added exhaustive tests to ensure
that these types always contain valid data. e.g. inject various invalid jsons and check for errors
"""
from core_types import Sentiment, SentimentClassification
from tests.utils.core_types_factories import SentimentClassificationFactory, SentimentFactory


def test_round_trip_sentiment_classification():
    SentimentClassification.from_json(
        SentimentClassificationFactory.create()
    )


def test_round_trip_sentiment():
    # If I had more time could have exercise the deserialisation errors
    Sentiment.from_json(
        SentimentFactory.create()
    )
