"""
Tests for the API itself

Here we're not trying to exercise all the code paths in the database code but rather the code in
the API itself: the 400/404 errors mainly

We're limiting ourselves to checking the status codes mostly (given that the api logic is very
thin), in real life it's good to eyeball the results through manual curling (or the FastAPI
provided /docs manual test page)

If the API logic (on top of DB) was non-trivial it'd be good to move it out to its own module and
test that
"""
from fastapi.testclient import TestClient
from main import app

import database


REVIEW_ID = "0009fe3b-711b-4337-94fb-0c19ac292990"
MODEL_ID = "000c8df3-441c-4fca-bb74-d48e9cbdebcd"


def get_db_conn():
    from database import FakeNoSQLDBClient
    from tests.utils.core_types_factories import SentimentFactory, SentimentClassificationFactory
    from uuid import UUID

    db_client = FakeNoSQLDBClient(data={})

    # An entry with hardcoded ids easier to debug when playing with /docs
    db_client.add(
        SentimentClassificationFactory.create(
            modelId=UUID(MODEL_ID),
            reviewId=UUID(REVIEW_ID),
            modelOutput=[
                SentimentFactory.create(sentiment="happy", probability=0.9),
                SentimentFactory.create(sentiment="sad", probability=0.1)
            ]
        )
    )
    return db_client


TEST_CLIENT = TestClient(app)


def test_sentimentModelMetadata(monkeypatch):
    monkeypatch.setattr(database, "get_db_conn", get_db_conn)
    resp = TEST_CLIENT.get(f"/sentimentModelMetadata/{REVIEW_ID}")
    assert resp.status_code == 200
    assert "modelOutput" not in resp.json()

    resp = TEST_CLIENT.get(f"/sentimentModelMetadata/{REVIEW_ID}/?modelId={MODEL_ID}")
    assert resp.status_code == 200

    resp = TEST_CLIENT.get("/sentimentModelMetadata/notvalidUUID")
    assert resp.status_code == 400

    non_existant_uuid_str = "a" + REVIEW_ID[1:]
    resp = TEST_CLIENT.get(f"/sentimentModelMetadata/{non_existant_uuid_str}")
    assert resp.status_code == 404


def test_sentimentModelRecommdendation(monkeypatch):
    monkeypatch.setattr(database, "get_db_conn", get_db_conn)
    resp = TEST_CLIENT.get(f"/sentimentModelRecommendation/{REVIEW_ID}/?modelId={MODEL_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["probability"] == 0.9
    assert data["sentiment"] == "happy"

    # If I had more time: would repeat the 400/404 tests


def test_topSentimentConfidence(monkeypatch):
    monkeypatch.setattr(database, "get_db_conn", get_db_conn)
    resp = TEST_CLIENT.get(f"/topSentimentConfidence/{REVIEW_ID}/?modelId={MODEL_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert data == "high"

    # If I had more time: would repeat the 400/404 tests


def test_topPositiveSentiment(monkeypatch):
    monkeypatch.setattr(database, "get_db_conn", get_db_conn)
    resp = TEST_CLIENT.get(f"/topPositiveSentiments/{REVIEW_ID}/?modelId={MODEL_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert data == ["happy"]

    # If I had more time: would repeat the 400/404 tests


def test_topNegativeSentiment(monkeypatch):
    monkeypatch.setattr(database, "get_db_conn", get_db_conn)
    resp = TEST_CLIENT.get(f"/topNegativeSentiments/{REVIEW_ID}/?modelId={MODEL_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert data == []

    # If I had more time: would repeat the 400/404 tests
