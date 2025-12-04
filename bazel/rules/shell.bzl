def _concat_files_impl(ctx):
    print("Analyzing ...", ctx.label)
    print("ctx.label.name", ctx.label.name)

    out = ctx.actions.declare_file(ctx.attr.filename)

    source_paths = []

    # afaict no easy way to distinguish between raw file dep vs proper rule dep
    for dep in ctx.attr.sources:
        # In the case of a raw file dep, files is just a one list el
        source_paths.extend(dep.files.to_list())

    print("Source paths:", source_paths)

    ctx.actions.run_shell(
        # These define the dependencies in the graph
        inputs = source_paths,
        outputs = [out],
        arguments = [f.path for f in source_paths],
        command = "echo \"batcat \"$@\" > {} \"&& batcat \"$@\" > {}".format(out.path, out.path)
    )

    return [DefaultInfo(files = depset([out]))]


concat_files = rule(
    implementation = _concat_files_impl,
    attrs = {
        "filename": attr.string(),
        # This is usually other targets
        "sources": attr.label_list(
            allow_files=True
        ),
        # TWEAK
        "setting": attr.label()
    }
)

print("bzl file evaluation")
