load("//rules:shell.bzl", "concat_files")

concat_files(
    name = "foo",
    filename = "foo.txt",
    sources = [
        "hello.txt",
        "world.txt",
    ]
)
concat_files(
    name = "bar",
    filename = "bar.txt",
    sources = [
        "babar.txt",
        ":foo"
    ]
)
