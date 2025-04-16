cc_library(
    name = "move_semantics",
    srcs = ["move_semantics.cc"],
    hdrs = ["move_semantics.h"],
    visibility = ["//visibility:public"],
    deps = [
        "//vstring:vstring",
    ]
)

cc_test(
    name = "move_semantics_test",
    srcs = ["move_semantics_test.cc"],
    deps = [
        ":move_semantics",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
