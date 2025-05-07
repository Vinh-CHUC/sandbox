cc_library(
    name = "algos",
    srcs = ["algos.cc"],
    hdrs = ["algos.h"],
    deps = [],
    visibility = ["//visibility:public"],
)

cc_library(
    name = "intervals",
    srcs = ["intervals.cc"],
    hdrs = ["intervals.h"],
    deps = [],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "algos_test",
    srcs = ["algos_test.cc"],
    deps = [
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)

cc_test(
    name = "intervals_test",
    srcs = ["intervals_test.cc"],
    deps = [
        ":intervals",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)

cc_test(
    name = "nsum_test",
    srcs = ["nsum_test.cc"],
    deps = [
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
