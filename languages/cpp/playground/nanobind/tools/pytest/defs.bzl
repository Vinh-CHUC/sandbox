load("@rules_python//python:defs.bzl", "py_test")

def pytest_test_manypy(
    name, python_versions, srcs, pip_deps = [], deps = [], args = [], data = [], **kwargs):
    [
        py_test(
            name = name + "_" + pv,
            srcs = [
                "//nanobind/tools/pytest:pytest_wrapper.py",
            ] + srcs,
            main = "//nanobind/tools/pytest:pytest_wrapper.py",
            args = ["--capture=no"] + args + ["$(location :%s)" % x for x in srcs],
            python_version = pv,
            deps = deps + [
                "@pip_{}//pytest".format(pv)
            ] + [
                "@pip_{}//{}".format(pv, dep)
                for dep in pip_deps
            ],
            data = data,
            **kwargs
        )
        for pv in python_versions
    ]

def pytest_test(name, srcs, deps = [], args = [], data = [], **kwargs):
    py_test(
        name = name,
        srcs = [
            "//nanobind/tools/pytest:pytest_wrapper.py",
        ] + srcs,
        main = "//nanobind/tools/pytest:pytest_wrapper.py",
        args = ["--capture=no"] + args + ["$(location :%s)" % x for x in srcs],
        deps = deps + ["@pip_3.13//pytest"],
        data = data,
        **kwargs
    )
