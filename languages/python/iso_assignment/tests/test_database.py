"""
Testing the various methods of FakeNoSQLDBClient one by one
This aims to be quite exhaustive and conceptually exercise all the code paths in database.py

For each method there's a TestClass with multiple cases for happy and unhappy paths
"""
import uuid
from uuid import UUID
import pytest

from database import FakeNoSQLDBClient, SentimentDBException
from tests.utils.core_types_factories import SentimentFactory, SentimentClassificationFactory


@pytest.fixture
def fake_db_client():
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
