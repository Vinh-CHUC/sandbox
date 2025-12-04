def _mysetting_impl(ctx):
    # No outputs: this is a configuration setting, not a rule that builds files.
    return []

mysetting = rule(
    implementation = _mysetting_impl,
    build_setting = config.string(flag = True),
)
