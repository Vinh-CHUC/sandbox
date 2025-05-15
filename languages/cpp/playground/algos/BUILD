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

cc_library(
    name = "linked_list",
    srcs = ["linked_list.cc"],
    hdrs = ["linked_list.h"],
    deps = [],
    visibility = ["//visibility:public"],
)

cc_library(
    name = "binary_tree",
    srcs = ["binary_tree.cc"],
    hdrs = ["binary_tree.h"],
    deps = [],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "binary_tree_test",
    srcs = ["binary_tree_test.cc"],
    deps = [
        ":binary_tree",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
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
    name = "linked_list_test",
    srcs = ["linked_list_test.cc"],
    deps = [
        ":linked_list",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "nsum_test",
    srcs = ["nsum_test.cc"],
    deps = [
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
