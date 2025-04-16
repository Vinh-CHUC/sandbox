load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "forward",
    srcs = ["forward.cc"],
    hdrs = ["forward.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "forward_test",
    srcs = ["forward_test.cc"],
    deps = [
        ":forward",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
