from dataclasses import dataclass
from typing import List
from uuid import UUID


class ValidationError(Exception):
    pass


@dataclass
class Sentiment:
    sentiment: str
    probability: float

    def __post_init__(self):
        if not 0 <= self.probability or not self.probability <= 1:
            raise ValidationError("Probability must be between 0 and 1.")

    @classmethod
    def from_json(cls, data: dict) -> "Sentiment":
        return cls(**data)


@dataclass
class SentimentClassification:
    modelID: UUID
    modelName: str
    modelVersion: str
    reviewId: UUID
    modelOutput: List[Sentiment]

    def __post_init__(self):
        if not self.modelID:
            raise ValidationError("modelID must be a non-empty UUID.")
        if not self.modelName:
            raise ValidationError("modelName must be a non-empty string.")
        if not self.modelVersion:
            raise ValidationError("modelVersion must be a non-empty string.")
        if not self.reviewId:
            raise ValidationError("reviewId must be a non-empty UUID.")
        if not self.modelOutput:
            raise ValidationError("modelOutput must not be empty")

    @classmethod
    def from_json(cls, data: dict) -> "SentimentClassification":
        return cls(
            modelID=UUID(data.get("modelID")),
            modelName=data.get("modelName", ""),
            modelVersion=data.get("modelVersion", ""),
            reviewId=UUID(data.get("reviewId", "")),
            modelOutput=[Sentiment.from_json(label) for label in data.get("labels", [])]
        )
