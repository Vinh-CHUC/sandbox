cc_library(
    name = "newtype",
    srcs = ["newtype.cc"],
    hdrs = ["newtype.h"],
    visibility = ["//visibility:public"],
    deps = [
        "@boost//:serialization",
        "@tartanllama_expected//:expected",
        "@tartanllama_optional//:optional",
    ]
)

cc_test(
    name = "newtype_test",
    srcs = ["newtype_test.cc"],
    deps = [
        ":newtype",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
