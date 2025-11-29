load("//nanobind/tools/pytest:defs.bzl", "pytest_test", "pytest_test_manypy")

pytest_test_manypy(
    name = "test_numpy",
    python_versions = ["3.13", "3.14"],
    srcs = ["test_numpy.py"],
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground"
    ],
    pip_deps = ["numpy"]
)
