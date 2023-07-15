"""
The main data model, the various classes can be built from the JSONs that are stored in the fake
DB

Tradeoffs:
    - When loading the JSONs there should be more care to ensure the data types are correct
    For example in the __post_init__() we could raise a variety of Exceptions if the strings are
    empty etc.. Or we could use libraries like pydantic
"""
from dataclasses import dataclass
from typing import List
import uuid
from uuid import UUID


class ValidationError(Exception):
    pass


@dataclass
class Sentiment:
    sentiment: str
    probability: float

    def __post_init__(self):
        # In the real world this could much more thorough
        if not 0 <= self.probability or not self.probability <= 1:
            raise ValidationError("Probability must be between 0 and 1.")

    @classmethod
    def from_json(cls, data: dict) -> "Sentiment":
        return cls(**data)


@dataclass
class SentimentClassification:
    modelId: UUID
    modelName: str
    modelVersion: str
    reviewId: UUID
    modelOutput: List[Sentiment]

    @classmethod
    def from_json(cls, data: dict) -> "SentimentClassification":
        return cls(
            modelId=data.get("modelId", uuid.uuid4()),
            modelName=data.get("modelName", ""),
            modelVersion=data.get("modelVersion", uuid.uuid4()),
            reviewId=data.get("reviewId", ""),
            modelOutput=[
                Sentiment.from_json(label) for label in data.get("modelOutput", [])
            ],
        )
