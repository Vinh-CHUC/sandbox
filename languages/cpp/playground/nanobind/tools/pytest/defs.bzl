load("@rules_python//python:defs.bzl", "py_test")
load("@pip//:requirements.bzl", "requirement")

def pytest_test(name, srcs, deps = [], args = [], data = [], **kwargs):
    py_test(
        name = name,
        srcs = [
            "//nanobind/tools/pytest:pytest_wrapper.py",
        ] + srcs,
        main = "//nanobind/tools/pytest:pytest_wrapper.py",
        args = ["--capture=no"] + args + ["$(location :%s)" % x for x in srcs],
        python_version = "PY3",
        srcs_version = "PY3",
        deps = deps + [requirement("pytest")],
        data = data,
        **kwargs
    )
