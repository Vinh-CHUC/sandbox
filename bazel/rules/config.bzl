def _mysetting_impl(ctx):
    return []

mysetting = rule(
    implementation = _mysetting_impl,
    build_setting = config.string(flag = True),
)
