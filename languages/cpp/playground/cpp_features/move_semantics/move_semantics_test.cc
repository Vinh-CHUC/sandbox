#include "cpp_features/move_semantics/move_semantics.h"

#include <gtest/gtest.h>

TEST(MoveSemantics, OnlyCopying){
  VString str("hello");
  VString str2 = fn(str);

  // Copy into, move back
  ASSERT_EQ(str2.get_copy_count(), 1);
  // Returning a non-const produces an r-value
  // Note that here RVO does not apply as fn returns one of its parameters
  ASSERT_EQ(str2.get_moves_count(), 1);

  // Interestingly...
  VString&& str3 = fn(str);
  ASSERT_EQ(str3.get(), "hello");
}


TEST(MoveSemantics, Move){
  VString str("hello");
  VString str2 = fn(std::move(str));
  // Copy into, move back
  ASSERT_EQ(str2.get_copy_count(), 0);
  // Note that here RVO does not apply as fn returns one of its parameters
  ASSERT_EQ(str2.get_moves_count(), 2);
}

TEST(MoveSemantics, ExplicitMove){
  VString str("hello");
  VString str2 = fn2(std::move(str));

  // Calling the function doesn't involve any constructor! as fn2 takes a &&
  ASSERT_EQ(str2.get_moves_count(), 1);

  ASSERT_EQ(str2.get_copy_count(), 0);
}

TEST(MoveSemantics, ExplicitMove2){
  VString str("hello");
  VString&& str2 = fn3(std::move(str));

  // Calling the function doesn't involve any constructor! as fn2 takes a &&
  ASSERT_EQ(str2.get_moves_count(), 0);
  ASSERT_EQ(str2.get_copy_count(), 0);
}
