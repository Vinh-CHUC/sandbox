## Priorities for parameters injection

1. run_config:
    - `my_job.execute_in_process(run_config=run_config)`
    - cli: `dg launch --job my_job --config my_config.yaml`
    - UI
2. job_level (`@job`)
