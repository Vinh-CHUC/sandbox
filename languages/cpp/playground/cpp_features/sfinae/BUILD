cc_library(
    name = "sfinae",
    srcs = ["sfinae.cc"],
    hdrs = ["sfinae.h"],
    visibility = ["//visibility:public"],
    deps = [
        "@tartanllama_expected//:expected",
        "@tartanllama_optional//:optional",
    ]
)

cc_test(
    name = "sfinae_test",
    srcs = ["sfinae_test.cc"],
    deps = [
        ":sfinae",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
