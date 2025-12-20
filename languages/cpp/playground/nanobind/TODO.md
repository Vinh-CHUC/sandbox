## To Try
- [x] Get things to build, and produce a python package
- [x] Hello world of some kind
- [x] numpy array
- [x] Vectorise pytest_test across multiple python versions
- [ ] [In Progress] Exchanging information, object ownership
- [ ] stubgen
- [ ] round trip
- [ ] Return a bound cpp type "by value"
- [ ] Type casters (STLs) with non trivial types
- [ ] catching exceptions on C++ end
- [ ] pandas

### Advanced
- [ ] https://github.com/wjakob/nanobind/blob/68b9ae82a3ed1ac34b2b96b141b45554ee79a497/include/nanobind/operators.h

## Questions

- The point of adding a python boilerplate that just loads the extension?
    -  Hides internal structure of the extension/its name etc.
- At what point is the python toolchain used?:
    - to provide python header files/libs/etc. that are necessary to build the extension
- Packaging
