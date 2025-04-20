cc_library(
    name = "type_erasure",
    srcs = ["type_erasure.cc"],
    hdrs = ["type_erasure.h"],
    visibility = ["//visibility:public"],
    deps = [
        "@tartanllama_expected//:expected",
        "@tartanllama_optional//:optional",
    ]
)

cc_test(
    name = "type_erasure_test",
    srcs = ["type_erasure_test.cc"],
    deps = [
        ":type_erasure",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
