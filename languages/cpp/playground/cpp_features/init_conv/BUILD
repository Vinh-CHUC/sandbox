load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "init_conv",
    srcs = ["init_conv.cc"],
    hdrs = ["init_conv.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "init_conv_test",
    srcs = ["init_conv_test.cc"],
    deps = [
        ":init_conv",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
