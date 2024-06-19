from dagster import AssetSelection, Definitions, ScheduleDefinition, define_asset_job, load_assets_from_modules
from dagster._core.definitions.partition import cron_schedule_from_schedule_type_and_offsets

from . import assets

all_assets = load_assets_from_modules([assets])

hackernews_job = define_asset_job("hackernews_job", selection=AssetSelection.all())

hackernews_schedule = ScheduleDefinition(
    job=hackernews_job,
    cron_schedule="0 * * * *"
)

defs = Definitions(
    assets=all_assets,
    schedules=[hackernews_schedule]
)
