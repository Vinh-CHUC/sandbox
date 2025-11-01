cc_library(
    name = "reflection",
    srcs = ["reflection.cc"],
    hdrs = ["reflection.h"],
    visibility = ["//visibility:public"],
    deps = [
        "@tartanllama_expected//:expected",
        "@tartanllama_optional//:optional",
    ]
)

cc_test(
    name = "reflection_test",
    srcs = ["reflection_test.cc"],
    deps = [
        ":reflection",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
