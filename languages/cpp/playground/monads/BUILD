cc_library(
    name = "monads",
    srcs = ["monads.cc"],
    hdrs = ["monads.h"],
    visibility = ["//visibility:public"],
    deps = [
        "@tartanllama_expected//:expected",
    ]
)

cc_test(
    name = "monads_test",
    srcs = ["monads_test.cc"],
    deps = [
        ":monads",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
