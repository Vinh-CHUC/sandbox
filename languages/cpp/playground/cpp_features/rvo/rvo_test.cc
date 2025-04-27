#include "cpp_features/rvo/rvo.h"

#include <gtest/gtest.h>

TEST(RVO, RVO) {
  VString str = build_vstring();
  ASSERT_EQ(str.get_copy_count(), 0);
  ASSERT_EQ(str.get_moves_count(), 0);
}

TEST(RVO, NRVO) {
  VString str = build_vstring2();
  ASSERT_EQ(str.get_copy_count(), 0);
  ASSERT_EQ(str.get_moves_count(), 0);
}

TEST(RVO, RecursiveNRVO) {
  VString str = pass_along();
  ASSERT_EQ(str.get_copy_count(), 0);
  ASSERT_EQ(str.get_moves_count(), 0);
}

TEST(RVO, RVOIntoFieldInit) {
  A a = build_a();
  ASSERT_EQ(a.v.get_copy_count(), 0);
  ASSERT_EQ(a.v.get_moves_count(), 0);
}

TEST(RVO, RVODoesNotApply) {
  VString str = build_vstring3();
  ASSERT_EQ(str.get_copy_count(), 0);
  ASSERT_EQ(str.get_moves_count(), 1);
}
