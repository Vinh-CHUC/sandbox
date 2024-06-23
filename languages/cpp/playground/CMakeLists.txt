cmake_minimum_required(VERSION 3.14)

project(playground)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(${PROJECT_SOURCE_DIR}/include)

# GTest
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
FetchContent_MakeAvailable(googletest)

enable_testing()

file(GLOB_RECURSE TEST_SOURCES "tests/*.cpp")
add_executable(
  playground_test
  ${TEST_SOURCES}
)
target_link_libraries(
  playground_test
  GTest::gtest_main
)

include(GoogleTest)
gtest_discover_tests(playground_test)

# Main executable
file(GLOB_RECURSE SOURCES "src/*.cpp")
add_executable(playground ${SOURCES})
