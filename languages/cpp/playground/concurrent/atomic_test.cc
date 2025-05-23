#include <atomic>

#include <gtest/gtest.h>

TEST(Atomic, Basic){
  std::atomic<int> aint{0};
  aint++;
  // aint *= 2;
}
