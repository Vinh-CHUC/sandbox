load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "atomic",
    srcs = ["atomic.cc"],
    hdrs = ["atomic.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "atomic_test",
    srcs = ["atomic_test.cc"],
    deps = [
        ":atomic",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
