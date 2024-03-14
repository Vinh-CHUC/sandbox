run:
	docker run -p 8529:8529 -e ARANGO_ROOT_PASSWORD=openSesame arangodb/arangodb:3.11.8

download-data:
	wget https://arango-datasets.s3.amazonaws.com/travel/airports.jsonl
	wget https://arango-datasets.s3.amazonaws.com/travel/flights.jsonl
	wget https://arango-datasets.s3.amazonaws.com/travel/points-of-interest.jsonl

# jq -c '.[]' input.json > output.jsonl
# jq -s '.' output.jsonl > input.json
