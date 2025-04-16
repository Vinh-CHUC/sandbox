load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "builder",
    srcs = ["builder.cc"],
    hdrs = ["builder.h"],
    deps = ["@boost//:hana"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "builder_test",
    srcs = ["builder_test.cc"],
    deps = [
        ":builder",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
