load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "exchange_and_ownership",
    srcs = ["__init__.py"],
    data = [
        ":exchange_and_ownership_ext",
        ":bind_ext",
        ":capsule_ext",
        ":refcount_ext"
    ],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "exchange_and_ownership_ext",
    srcs = ["exchange_and_ownership.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "bind_ext",
    srcs = ["bind.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "capsule_ext",
    srcs = ["capsule.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "refcount_ext",
    srcs = ["refcount.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_stubgen(
    name = "exchanging_information_stub",
    module = ":exchange_and_ownership_ext",
)
