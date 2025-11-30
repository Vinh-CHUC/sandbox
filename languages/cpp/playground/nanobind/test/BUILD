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

py_test(
    name = "test_dummy",
    srcs = ["test_dummy.py"]
)

pytest_test(
    name = "test_exchanging_information",
    srcs = ["test_exchanging_information.py"],
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground"
    ],
)
