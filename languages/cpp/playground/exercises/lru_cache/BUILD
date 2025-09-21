cc_library(
    name = "doubly_linked_list",
    srcs = ["doubly_linked_list.cc"],
    hdrs = ["doubly_linked_list.h"],
    visibility = ["//visibility:public"],
    deps = [
        "//vstring:vstring",
    ]
)

# cc_library(
#     name = "lru_cache",
#     srcs = ["lru_cache.cc"],
#     hdrs = ["lru_cache.h"],
#     visibility = ["//visibility:public"],
#     deps = [
#         "//vstring:vstring",
#     ]
# )

# cc_test(
#     name = "lru_cache_test",
#     srcs = ["lru_cache_test.cc"],
#     deps = [
#         ":lru_cache",
#         "@googletest//:gtest",
#         "@googletest//:gtest_main",
#     ]
# )

cc_test(
    name = "doubly_linked_list_test",
    srcs = ["doubly_linked_list_test.cc"],
    deps = [
        ":doubly_linked_list",
        "@googletest//:gtest",
        "@googletest//:gtest_main",
    ]
)
