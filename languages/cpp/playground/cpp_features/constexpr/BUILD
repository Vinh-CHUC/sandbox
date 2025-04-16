load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "constexpr",
    srcs = ["constexpr.cc"],
    hdrs = ["constexpr.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "constexpr_test",
    srcs = ["constexpr_test.cc"],
    deps = [
        ":constexpr",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
        "@ranges-v3//:range-v3",
    ]
)
