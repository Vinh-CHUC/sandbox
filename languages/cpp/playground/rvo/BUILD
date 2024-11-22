cc_library(
    name = "rvo",
    srcs = ["rvo.cc"],
    hdrs = ["rvo.h"],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "rvo_test",
    srcs = ["rvo_test.cc"],
    deps = [
        ":rvo",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
        "@ranges-v3//:range-v3",
    ]
)
