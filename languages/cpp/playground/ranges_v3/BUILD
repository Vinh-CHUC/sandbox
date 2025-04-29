cc_library(
    name = "ranges_v3",
    srcs = ["ranges_v3.cc"],
    hdrs = ["ranges_v3.h"],
    deps = [
        "@ranges-v3//:range-v3",
    ],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "ranges_v3_test",
    srcs = ["ranges_v3_test.cc"],
    deps = [
        ":ranges_v3",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
        "@ranges-v3//:range-v3",
    ]
)
