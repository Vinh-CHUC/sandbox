#include <atomic>
#include <chrono>
#include <thread>

#include <gtest/gtest.h>

using namespace std::chrono_literals;

TEST(Atomic, Basic){
  std::atomic<int> aint{0};
  aint++;
  // aint *= 2;
}

TEST(Threads, Basic){
  std::vector<std::thread> threads{};

  std::atomic<int> aint{0};

  for(int i = 0; i < 100; i++){
    threads.push_back(
      std::thread([&aint](){
        for(int i = 0; i < 100; i++){
          aint++;
        }
      })
    );
  }

  for(auto& t: threads){
    t.join();
  };

  ASSERT_EQ(aint.load(), 10000);
}

TEST(Threads, RaceCondition){
  std::vector<std::thread> threads{};

  int hello{0};

  for(int i = 0; i < 100; i++){
    threads.push_back(
      std::thread([&hello](){
        for(int i = 0; i < 100; i++){
          auto copy = hello;
          std::this_thread::sleep_for(1ms);
          hello = copy + 1;
        }
      })
    );
  }

  for(auto& t: threads){
    t.join();
  };

  // ASSERT_EQ(hello, 10000);
}
