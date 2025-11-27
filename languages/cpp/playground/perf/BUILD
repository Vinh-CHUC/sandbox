load("@rules_cc//cc:defs.bzl", "cc_library")

cc_library(
    name = "matmul",
    srcs = ["matmul.cc"],
    hdrs = ["matmul.h"],
    visibility = ["//visibility:public"],
)

cc_binary(
    name = "matmul_bench",
    srcs = ["matmul_bench.cc"],
    deps = [
        ":matmul",
        "@google_benchmark//:benchmark"
    ]
)
