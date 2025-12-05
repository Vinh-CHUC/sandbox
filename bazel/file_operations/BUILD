load("//rules:shell.bzl", "concat_files")
load("//rules:config.bzl", "mysetting")

# A configuration item, an instance of a rule() that has a build_setting attribute
mysetting(
    name="extension",
    build_setting_default="txt"
)

# Maps from a setting to a boolean effectively so that it can be consumed by select({})
config_setting(
    name = "log",
    flag_values = {
        ":extension": "log"
    }
)

concat_files(
    name = "foo",
    # Interesting this target does not to depend on :extension to leverage the select({})
    filename = select({
        ":log": "foo.log",
        "//conditions:default": "foo.txt"
    }),
    sources = [
        "hello.txt",
        "world.txt",
    ],
)

concat_files(
    name = "bar",
    filename = select({
        ":log": "bar.log",
        "//conditions:default": "bar.txt"
    }),
    sources = [
        "babar.txt",
        ":foo"
    ]
)
