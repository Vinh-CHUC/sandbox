# In a BUILD file, e.g. my_project/BUILD
load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

nanobind_extension(
    name = "nn",
    srcs = ["nn.cpp"],
)

nanobind_stubgen(
    name = "nn_stubgen",
    module = ":nn",
    marker_file = "src/py.typed",
    output_directory = "src",
    recursive=True,
)
