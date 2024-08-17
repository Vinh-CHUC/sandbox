load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "VString",
    srcs = ["VString.cc"],
    hdrs = ["VString.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "VString_test",
    size = "small",
    srcs = ["VString_test.cc"],
    deps = [
        ":VString",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ],
)
