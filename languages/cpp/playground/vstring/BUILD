load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "vstring",
    srcs = ["vstring.cc"],
    hdrs = ["vstring.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "vstring_test",
    size = "small",
    srcs = ["vstring_test.cc"],
    deps = [
        ":vstring",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ],
)
