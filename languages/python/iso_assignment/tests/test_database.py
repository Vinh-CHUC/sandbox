"""
Testing the various methods of FakeNoSQLDBClient one by one
This aims to be quite exhaustive and conceptually exercise all the code paths in database.py

For each method there's a TestClass with multiple cases for happy and unhappy paths

Given that this is a Fake implementation, load/performance testing is out of scope
"""
import uuid
import pytest

from database import FakeNoSQLDBClient, SentimentDBException
from tests.utils.core_types_factories import SentimentFactory, SentimentClassificationFactory


@pytest.fixture
def fake_db_client():
    """
    Throughout all the tests the DB already has some data in it
    I could have added tests that exercise scenarios where we query en empty DB, e.g. bugs around
    data being initialised to None as opposed to {}
    """
    db_client = FakeNoSQLDBClient(data={})
    classifications = [SentimentClassificationFactory.create() for _ in range(20)]
    for c in classifications:
        db_client.add(c)
    return db_client


class TestGetModelMetadata:
    def test_normal(self, fake_db_client: FakeNoSQLDBClient):
        sc = SentimentClassificationFactory.create()
        fake_db_client.add(sc)

        model_metadata = fake_db_client.getSentimentModelMetadata(sc["reviewId"], sc["modelId"])
        assert model_metadata.reviewId == sc["reviewId"]
        assert model_metadata.modelId == sc["modelId"]

    """
    Variant where there are multiple entries for a given reviewId, somehwat of a "whitebox" test
    to check that we don't override entries for a given reviewId for example
    """
    def test_normal_2(self, fake_db_client: FakeNoSQLDBClient):
        sc = SentimentClassificationFactory.create()
        others = [SentimentClassificationFactory.create(reviewId=sc["reviewId"]) for _ in range(10)]
        for x in [sc] + others:
            fake_db_client.add(x)

        model_metadata = fake_db_client.getSentimentModelMetadata(sc["reviewId"], sc["modelId"])
        assert model_metadata.reviewId == sc["reviewId"]
        assert model_metadata.modelId == sc["modelId"]

    def test_missing(self, fake_db_client: FakeNoSQLDBClient):
        with pytest.raises(SentimentDBException):
            fake_db_client.getSentimentModelMetadata(uuid.uuid4(), uuid.uuid4())
        with pytest.raises(SentimentDBException):
            fake_db_client.getSentimentModelMetadata(uuid.uuid4(), None)


class TestGetModelCount:
    def test_normal(self, fake_db_client: FakeNoSQLDBClient):
        # There could be duplicates sentiments here, could be improved
        sc = SentimentClassificationFactory.create(modelOutput=[SentimentFactory()] * 3)
        fake_db_client.add(sc)
        count = fake_db_client.getSentimentModelCount(sc["reviewId"], sc["modelId"])
        assert count == len(sc["modelOutput"])

    """
    Empty lists are always a good corner case, given that I know the implementation this is
    somewhat redundant but could be useful to check regresssions like:
        - no exceptions are thrown when retrieving classifications with 0 recommendations
    """
    def test_0_count(self, fake_db_client: FakeNoSQLDBClient):
        sc = SentimentClassificationFactory.create(modelOutput=[])
        fake_db_client.add(sc)
        count = fake_db_client.getSentimentModelCount(sc["reviewId"], sc["modelId"])
        assert count == 0

    """
    This can be somewhat redundant with test_missing in other classes, still useful to have but has
    diminishing returns? Would consider omitting it to keep the test suite leaner, or could do some
    meta programming to automatically add these tests? (iterate over the dbclient methods etc)
    """
    def test_missing(self, fake_db_client: FakeNoSQLDBClient):
        with pytest.raises(SentimentDBException):
            fake_db_client.getSentimentModelCount(uuid.uuid4(), uuid.uuid4())
        with pytest.raises(SentimentDBException):
            fake_db_client.getSentimentModelCount(uuid.uuid4(), None)


class TestGetSentimentModelRecommendation:
    def test_normal(self, fake_db_client: FakeNoSQLDBClient):
        sentiments = [
            SentimentFactory.create(sentiment="happy", probability=0.9),
            SentimentFactory.create(sentiment="sad", probability=0.8)
        ]
        sc = SentimentClassificationFactory.create(modelOutput=sentiments)
        fake_db_client.add(sc)
        sentiment = fake_db_client.getSentimentModelRecommendation(sc["reviewId"], sc["modelId"])
        assert sentiment.sentiment == "happy"
        assert sentiment.probability == 0.9

    def test_no_recommendations(self, fake_db_client: FakeNoSQLDBClient):
        sc = SentimentClassificationFactory.create(modelOutput=[])
        fake_db_client.add(sc)
        # If I had more time, could have been its specific exception type
        with pytest.raises(SentimentDBException):
            fake_db_client.getSentimentModelRecommendation(sc["reviewId"], sc["modelId"])

    """
    Going to omit the test_missing (reviewId/modelId) from now onwards to save time
    """
    # def test_missing(self, fake_db_client: FakeNoSQLDBClient):


class TestGetTopSentimentConfidence:
    """
    Is the >= vs > useful in practice? Given that probabilities are quite precise usually
    """
    def test_threshold_is_gt_not_gte(self, fake_db_client: FakeNoSQLDBClient):
        sentiments = [
            SentimentFactory.create(sentiment="happy", probability=0.71),
            SentimentFactory.create(sentiment="sad", probability=0.1)
        ]
        sc = SentimentClassificationFactory.create(modelOutput=sentiments)
        fake_db_client.add(sc)
        confidence = fake_db_client.getTopSentimentConfidence(sc["reviewId"], sc["modelId"])
        assert confidence == "high"

        sentiments = [
            SentimentFactory.create(sentiment="happy", probability=0.70),
            SentimentFactory.create(sentiment="sad", probability=0.1)
        ]
        sc = SentimentClassificationFactory.create(modelOutput=sentiments)
        fake_db_client.add(sc)
        confidence = fake_db_client.getTopSentimentConfidence(sc["reviewId"], sc["modelId"])
        assert confidence == "medium"

    # Didn't write the same test for low/medium would be the same
    # If I had more time I could have parametrized the test on the list of confidence intervals
    # This way the test suite would be more future-proof should that change

    def test_no_recommendations(self, fake_db_client: FakeNoSQLDBClient):
        sc = SentimentClassificationFactory.create(modelOutput=[])
        fake_db_client.add(sc)
        # If I had more time, could have been its specific exception type
        with pytest.raises(SentimentDBException):
            fake_db_client.getTopSentimentConfidence(sc["reviewId"], sc["modelId"])


class TestGetTopPositiveSentiment:
    def test_normal(self, fake_db_client: FakeNoSQLDBClient):
        sentiments = [
            SentimentFactory.create(sentiment="happy", probability=0.8),
            SentimentFactory.create(sentiment="amused", probability=0.9)
        ]
        sc = SentimentClassificationFactory.create(modelOutput=sentiments)
        fake_db_client.add(sc)
        top_pos = fake_db_client.topPositiveSentiments(sc["reviewId"], sc["modelId"])
        assert set(top_pos) == {"happy", "amused"}

        sentiments = [
            SentimentFactory.create(sentiment="happy", probability=0.8),
            SentimentFactory.create(sentiment="amused", probability=0.6)
        ]
        sc = SentimentClassificationFactory.create(modelOutput=sentiments)
        fake_db_client.add(sc)
        top_pos = fake_db_client.topPositiveSentiments(sc["reviewId"], sc["modelId"])
        assert set(top_pos) == {"happy"}

    # Didn't write the same test for low/medium would be the same
    # If I had more time I could have parametrized the test on the list of confidence intervals
    # This way the test suite would be more future-proof should that change
    def test_no_recommendations(self, fake_db_client: FakeNoSQLDBClient):
        sc = SentimentClassificationFactory.create(modelOutput=[])
        fake_db_client.add(sc)
        # If I had more time, could have been its specific exception type
        with pytest.raises(SentimentDBException):
            fake_db_client.topPositiveSentiments(sc["reviewId"], sc["modelId"])


"""
Omitting this to save time would be very similar to TestGetTopPositiveSentiment
Again we could add more abstraction to parametrize over both topPositive/topNegative
"""
# class TestGetTopNegativeSentiments:
