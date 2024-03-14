from dataclasses import dataclass, field
import json

from arango import ArangoClient, client, collection, database


def bootstrap():
    client = ArangoClient(hosts="http://localhost:8529")
    sys_db = client.db("_system", username="root", password="openSesame")
    sys_db.create_database("travel")

    db = client.db("travel", username="root", password="openSesame")
    db.create_collection("airports", edge=False)
    db.create_collection("flights", edge=True)
    db.create_collection("scratch", edge=False)
    return db

class Globals:
    client: client.ArangoClient
    db: database.StandardDatabase
    airports: collection.StandardCollection
    flights: collection.StandardCollection
    scratch: collection.StandardCollection

    def __init__(self):
        self.client = ArangoClient(hosts="http://localhost:8529")
        self.db = self.client.db("travel", username="root", password="openSesame")
        self.airports = self.db.collection("airports")
        self.flights= self.db.collection("flights")
        self.scratch = self.db.collection("scratch")

def import_data():
    g = Globals()

    with open("airports.jsonl", "r") as file:
        data = []
        for l in file.readlines():
            data.append(json.loads(l))
        g.airports.import_bulk(data)

    with open("flights.jsonl", "r") as file:
        data = []
        for l in file.readlines():
            data.append(json.loads(l))
        g.flights.import_bulk(data)

def scratch():
    g = Globals()
    g.scratch.insert({})   # Creates empty doc generates key
    g.scratch.insert({"foo": "bar"})   # Creates empty doc generates key
    for k in range(10):
        g.scratch.insert({"_key": str(k), "foo": "bar"})   # Creates empty doc generates key

    """
    g.scratch.get({"_key": "55"})
    g.scratch.get("5")
    g.scratch.get_many(["5", "6"])
    g.db.aql.execute("FOR d IN scratch RETURN d")

    g.db.aql.execute("let doc = DOCUMENT('scratch/5') return {'yoo':doc.foo}")

    # update: "merges" the two dictionaries
    """
    return g.db.aql.execute("FOR d IN scratch RETURN d")
