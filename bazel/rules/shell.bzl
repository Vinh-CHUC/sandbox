def _concat_files_impl(ctx):
    print("analyzing", ctx.label)

    out = ctx.actions.declare_file(ctx.attr.filename)

    ctx.actions.write(
        output = out,
        content = "Hello {}! \n".format(ctx.label.name),
    )

    return [DefaultInfo(files = depset([out]))]


concat_files = rule(
    implementation = _concat_files_impl,
    attrs = {
        "filename": attr.string()
    }
)

print("bzl file evaluation")
