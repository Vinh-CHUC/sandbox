load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "functor",
    srcs = ["functor.cc"],
    hdrs = ["functor.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "functor_test",
    srcs = ["functor_test.cc"],
    deps = [
        ":functor",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
