load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "matmul",
    srcs = ["matmul.cc"],
    hdrs = ["matmul.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "matmul_test",
    srcs = ["matmul_test.cc"],
    deps = [
        ":matmul",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
