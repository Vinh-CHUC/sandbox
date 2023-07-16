"""
A fake NoSQLDB for test purposes

The goal is to be able to run tests against it

I didn't add any logic around modifying records, given that the API is made of read-only methods

There are various TODOs in this code, i'd done them if I had more time
"""
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from typing import List, Dict, Optional
from uuid import UUID

from core_types import SentimentClassification, Sentiment


# TODO If I had more time could have created an actual wrapper type to represent this, it'd be more
# robut type-wise. e.g. it would allow the type-checker to catch bugs like trying to use a
# ReviewUUID where we need a ModelUUID
ReviewUUID = UUID


class ErrorCode(Enum):
    REVIEW_ID_NOT_FOUND = "ReviewId not found"
    MODEL_ID_NOT_FOUND = "ModelId not found"
    NO_CLASSIFICATION_FOUND_FOR_REVIEW = (
        "The model didn't produce any recommendations for review"
    )
    NO_MODEL_RECOMMENDATIONS = (
        "None of the models for the review have any recommendations"
    )


# TODO: a exception for each error code
class SentimentDBException(Exception):
    def __init__(self, message):
        super().__init__(message)


HIGH_THRESHOLD = 0.7
MEDIUM_THRESHOLD = 0.3


class Confidence:
    HIGH_CONFIDENCE = "high"
    MEDIUM_CONFIDENCE = "medium"
    LOW_CONFIDENCE = "low"


@dataclass
class FakeNoSQLDBClient:
    """
    There is 1:1 mapping between the public methods and the API ones
    I've tried to factor out most of the common logic into various helpers (private methods)
    """
    data: Dict[UUID, List[Dict]]

    # If I had more time, create a separate class to hold the metadata only (without the output)
    # The modelOutput is truncated in the API
    def getSentimentModelMetadata(
        self, reviewId: UUID, modelId: Optional[UUID]
    ) -> SentimentClassification:
        return self._getSentimentClassification(reviewId, modelId)

    """
    Chose not to implement this see comment in main.py
    """
    def getSentimentModelRecommendations(
        self, _reviewId: UUID, _pages: int, _pageLimit: int, _modelID: Optional[UUID]
    ) -> List[Sentiment]:
        return []

    def getSentimentModelCount(self, reviewId: UUID, modelId: Optional[UUID]) -> int:
        return len(self._getSentimentClassification(reviewId, modelId).modelOutput)

    def getSentimentModelRecommendation(
        self, reviewId: UUID, modelId: Optional[UUID]
    ) -> Sentiment:
        sentiments: List[Sentiment] = self._getSentiments(reviewId, modelId)
        return sorted(sentiments, key=lambda x: x.probability, reverse=True)[0]

    def getTopSentimentConfidence(self, reviewId: UUID, modelId: Optional[UUID]) -> str:
        sentiments: List[Sentiment] = self._getSentiments(reviewId, modelId)
        top_sentiment = sorted(sentiments, key=lambda x: x.probability, reverse=True)[0]
        if top_sentiment.probability > HIGH_THRESHOLD:
            return Confidence.HIGH_CONFIDENCE
        elif top_sentiment.probability > MEDIUM_THRESHOLD:
            return Confidence.MEDIUM_CONFIDENCE
        else:
            return Confidence.LOW_CONFIDENCE

    # If I had more time: a better type annotation? Literal[..] ?
    def topPositiveSentiments(
        self, reviewId: UUID, modelId: Optional[UUID]
    ) -> List[str]:
        high_confidence_sentiments: List[Sentiment] = self._getHighConfidenceSentiments(
            reviewId, modelId
        )
        return [
            s.sentiment
            for s in high_confidence_sentiments
            # TODO use literal constants
            if s.sentiment in ["happy", "amused"]
        ]

    def topNegativeSentiments(
        self, reviewId: UUID, modelId: Optional[UUID]
    ) -> List[str]:
        high_confidence_sentiments: List[Sentiment] = self._getHighConfidenceSentiments(
            reviewId, modelId
        )
        return [
            s.sentiment
            for s in high_confidence_sentiments
            # TODO use literal constants
            if s.sentiment in ["angry", "sad"]
        ]

    def _getHighConfidenceSentiments(self, reviewId: UUID, modelId: Optional[UUID]):
        sentiments: List[Sentiment] = self._getSentiments(reviewId, modelId)
        return [s for s in sentiments if s.probability > HIGH_THRESHOLD]

    def _getSentiments(self, reviewId: UUID, modelId: Optional[UUID]):
        sentiments: List[Sentiment] = self._getSentimentClassification(
            reviewId, modelId
        ).modelOutput

        if not sentiments:
            raise SentimentDBException(ErrorCode.NO_CLASSIFICATION_FOUND_FOR_REVIEW)

        return sentiments

    def _getSentimentClassification(
        self, reviewID: UUID, modelId: Optional[UUID]
    ) -> SentimentClassification:
        if reviewID not in self.data:
            raise SentimentDBException(ErrorCode.REVIEW_ID_NOT_FOUND.value)

        if modelId is None:
            # In a real life scenario we'd have to come up with some strategy to pick the default
            # model, most recent version from some hardcoded model name?
            # If I had more time I would have implemented this, ie one of the models is defined as
            # being the default
            classifications = self.data[reviewID][:1]
        else:
            classifications = [
                c for c in self.data[reviewID] if c["modelId"] == modelId
            ]

        # Chose to not deal with the problem of duplicate entries for lack of time
        if not len(classifications) == 1:
            raise SentimentDBException(ErrorCode.MODEL_ID_NOT_FOUND.value)

        # Also chose not to deal with deserialisation errors, in real life we might:
        # - treat it as of one REVIEW or MODEL not found
        # - return a specific error type
        # - log an error somewhere so that someone can investigate the bad data
        return SentimentClassification.from_json(classifications[0])

    """
    For testing
    """

    def add(self, sc: dict):
        assert "reviewId" in sc
        self.data.setdefault(sc["reviewId"], []).append(sc)


@lru_cache(maxsize=None)
def get_db_conn() -> FakeNoSQLDBClient:
    from tests.utils.core_types_factories import SentimentClassificationFactory
    from uuid import UUID

    db_client = FakeNoSQLDBClient(data={})
    classifications = [SentimentClassificationFactory.create() for _ in range(20)]
    for c in classifications:
        db_client.add(c)

    # An entry with hardcoded ids easier to debug when playing with /docs
    db_client.add(
        SentimentClassificationFactory.create(
            modelId=UUID("26ac8df3-441c-4fca-bb74-d48e9cbdebcd"),
            reviewId=UUID("58e9fe3b-711b-4337-94fb-0c19ac292990"),
        )
    )
    return db_client
