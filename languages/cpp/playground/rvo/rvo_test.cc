#include "rvo/rvo.h"

#include <vector>
#include <string>
#include <gtest/gtest.h>

TEST(RangesV3Test, Mutation) {
    std::vector<std::string> vec;
    mutate_vec(vec);
    ASSERT_EQ(vec[0], "hello");
}
