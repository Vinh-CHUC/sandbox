load("//rules:shell.bzl", "concat_files")
load("//rules:config.bzl", "mysetting")

mysetting(
    name="foo_setting",
    build_setting_default="hehe"
)

concat_files(
    name = "foo",
    filename = "foo.txt",
    sources = [
        "hello.txt",
        "world.txt",
    ],
    setting=":foo_setting"
)

concat_files(
    name = "bar",
    filename = "bar.txt",
    sources = [
        "babar.txt",
        ":foo"
    ]
)
