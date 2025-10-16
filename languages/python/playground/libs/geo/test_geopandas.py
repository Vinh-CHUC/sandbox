from pathlib import Path

import geopandas as gpd
import pandas as pd
import pytest

NORTH_GREENWICH = Path(__file__).parent / "north_greenwich_peninsula.geojson"
LONDON = Path(__file__).parent / "greater_london.geojson"
PARIS = Path(__file__).parent / "paris.geojson"


def test_geojson_are_latlon():
    gdf = gpd.read_file(NORTH_GREENWICH)
    assert str(gdf.crs) == "EPSG:4326"


def test_cant_concat_mixed_crs():
    ng = gpd.read_file(NORTH_GREENWICH)
    london = gpd.read_file(LONDON).to_crs("EPSG:3857")
    with pytest.raises(ValueError):
        pd.concat([ng, london])

    london = gpd.read_file(LONDON).to_crs("EPSG:4326")
    pd.concat([ng, london])


def test_can_sjoin_mixed_crs():
    ng = gpd.read_file(NORTH_GREENWICH)
    london = gpd.read_file(LONDON).to_crs("EPSG:3857")

    join = ng.sjoin(london)
    assert join.empty

    ng = gpd.read_file(NORTH_GREENWICH)
    london = gpd.read_file(LONDON)
    join = ng.sjoin(london)
    assert not join.empty


def test_union_all():
    ng = gpd.read_file(NORTH_GREENWICH)
    london = gpd.read_file(LONDON)
    paris = gpd.read_file(PARIS)
    gdf = pd.concat([ng, london, paris])
    gpd.GeoSeries([gdf.union_all()], crs=ng.crs)
