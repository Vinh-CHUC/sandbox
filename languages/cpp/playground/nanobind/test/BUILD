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

pytest_test_manypy(
    name = "test_py_callable",
    python_versions = ["3.13", "3.14"],
    srcs = ["test_py_callable.py"],
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
    name = "test_exchange_and_ownership",
    srcs = ["test_exchange_and_ownership.py"],
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground"
    ],
)

pytest_test(
    name = "test_capsule",
    srcs = ["test_capsule.py"],
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground",
        "@pip_3.13//pyarrow"
    ],
)

pytest_test(
    name = "test_refcount",
    srcs = ["test_refcount.py"],
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground"
    ],
)
