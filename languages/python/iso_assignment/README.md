## How to run

### Initialise the conda environment
```
## The name of environment is "iso", change if needs be
conda env create -f conda.yml
conda activate iso
```
Alternatively any recent Python installation should just work, the only dependencies are
`factory-boy`, `fastapi[all]` and `pytest`

### Run the tests
```
PYTHONPATH=. pytest
```

### Run the server (if one wants to send real requests to fastAPI)
```
uvicorn main:app --reload
```

## Design walkthrough
My high-level thinking is that the focus of this exercise are the tests themselves:
- the database is a DB client that wraps a simplistic fake NoSQL implementation. Its functionalities are limited
to what is necessary to power the API methods.
- the API methods are defined in the `main` module itself as the logic on top of the database is
  very thin. There was little value in trying to separate the `main.py` into a `main.py` and a
  `api.py`
- for the tests, there are factories defined that help keep the test concise and readable. In
  particular it helps understand what is relevant to the tests logic
  
More details can be found in each of the modules
- **core_types.py**: two classes that mirror the JSON data that is stored in the database
- **database.py**: A fake NoSQL database+client, the aim being so that we have something to run the
  tests against.
- **main.py**: The Rest API itself, that uses the FastAPI python library

```
      ┌─────────────┐
      │  core_types │
      │             │
      └─────▲───────┘
            │
            │depends
            │
      ┌─────┴──────┐
      │            │
      │  database  │
      │            │
      └─────▲──────┘
            │
            │depends
            │
       ┌────┴─────┐
       │          │
       │   main   │
       │          │
       └──────────┘
```

Technically main also depends on `core_types` to generate the fake data.

### Tests
There are tests for each of the components, as well as factories to help generate the fake data.
Again there are more details in each file
```
test_api.py
test_database.py
test_core_types.py
utils/core_types_factories.py
```

## If I had more time I would have
1. Be even more exhaustive around test cases + the combinations of possible data,
   I've omitted some that were very close variations to existing ones. See details in tests files
2. Various nitpicks like having more constants instead of repeated static strings, better type
   annotations in a couple places.
3. Do a code covage analysis to understand where the gaps are.

I deliberately omitted the pagination API method as I thought it's weird. In real life I would have
asked for some clarification from the users.
If this was a real life project I would have:
- tried to run some integration with the client code to ensure we catch bugs like typos in the API
  method names for example.
- and then some load testing if relevant (ie. if the database stores a lot of information)
- and also swap the api/database that the tests are running against to "the real fake"
  implementations of the database/api
