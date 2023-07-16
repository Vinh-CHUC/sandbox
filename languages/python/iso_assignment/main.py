"""
The main API logic

If I had more time, the logic of the methods could be moved to another module. This is overkill
given that the API logic in the context of this exercise is quite thin. Other things I'd address:
    - the error handling for invalid UUID could be more robust
    - the routes definition could be somehow wrapped in their own class with a db_connection
    attribute to easily inject the fake database for easier testing (instead of monkeypatching)
    - the route URLs could be constants (to be shared with tests easily), althought it might be good
      to repeat them? lowers risk of typos
"""
import dataclasses
from functools import wraps
from typing import Optional
from uuid import UUID


from fastapi import FastAPI, HTTPException

import database

app = FastAPI()


def handle_400_404(func):
    """
    All methods share common logic around dealing with invalid UUIDs, not found reviewId/modelID
    This decorator encapsulates this
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except database.SentimentDBException as e:
            raise HTTPException(status_code=404, detail=str(e))
        except ValueError as e:
            # This is quite flaky as not very precise..
            # Should probably wrap UUID into our own type, have a custom exception etc.
            raise HTTPException(status_code=400, detail=str(e))

    return wrapper


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/debug")
def debug():
    return database.get_db_conn().data


@app.get("/sentimentModelMetadata/{reviewId}")
@handle_400_404
def sentimentModelMetadata(reviewId: str, modelId: Optional[str] = None):
    db = database.get_db_conn()
    ret = db.getSentimentModelMetadata(
        UUID(reviewId), UUID(modelId) if modelId else None
    )
    ret = dataclasses.asdict(ret)
    # TODO: this is a hack we should create a proper type for this
    del ret["modelOutput"]
    return ret


# I find this API method very odd given that the number of possible labels is very small. So
# pagination would be useless?
# Could this be that the intent was to retrieve all recommendations across all models for a given
# reviewId?
# I would clarify with the users
@app.get("/sentimentModelMetadata/{reviewId}/{pages}/{pageLimit}")
def sentimentModelRecommendations(
    reviewId: str,
    pages: int,
    pageLimit: int,
    modelId: Optional[str] = None,
):
    raise NotImplementedError


@app.get("/sentimentModelCount/{reviewId}")
@handle_400_404
def sentimentModelCount(reviewId: str, modelId: Optional[str] = None):
    db = database.get_db_conn()
    return db.getSentimentModelCount(UUID(reviewId), UUID(modelId) if modelId else None)


@app.get("/sentimentModelRecommendation/{reviewId}")
@handle_400_404
def sentimentModelRecommendation(reviewId: str, modelId: Optional[str] = None):
    db = database.get_db_conn()
    ret = db.getSentimentModelRecommendation(
        UUID(reviewId), UUID(modelId) if modelId else None
    )
    return dataclasses.asdict(ret)


@app.get("/topSentimentConfidence/{reviewId}")
@handle_400_404
def topSentimentConfidence(reviewId: str, modelId: Optional[str] = None):
    db = database.get_db_conn()
    return db.getTopSentimentConfidence(
        UUID(reviewId), UUID(modelId) if modelId else None
    )


@app.get("/topNegativeSentiments/{reviewId}")
@handle_400_404
def topNegativeSentiment(reviewId: str, modelId: Optional[str] = None):
    db = database.get_db_conn()
    return db.topNegativeSentiments(UUID(reviewId), UUID(modelId) if modelId else None)


@app.get("/topPositiveSentiments/{reviewId}")
@handle_400_404
def topPositiveSentiment(reviewId: str, modelId: Optional[str] = None):
    db = database.get_db_conn()
    return db.topPositiveSentiments(UUID(reviewId), UUID(modelId) if modelId else None)
