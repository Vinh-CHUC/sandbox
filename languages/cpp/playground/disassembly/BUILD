load("@rules_cc//cc:defs.bzl", "cc_binary")

cc_binary(
    name = "main",
    srcs = ["main.cc"],
    copts = ["-O2", "-fno-stack-protector", "-fcf-protection=none"]
)
