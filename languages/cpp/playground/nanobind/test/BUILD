load("@pip//:requirements.bzl", "requirement")
load("//nanobind/tools/pytest:defs.bzl", "pytest_test")

pytest_test(
    name = "test_numpy",
    srcs = ["test_numpy.py"],
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground",
        requirement("numpy"),
    ]
)
