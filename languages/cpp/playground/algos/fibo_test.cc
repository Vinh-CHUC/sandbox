#include <gtest/gtest.h>

int fibonacci(int n) {
  if (n == 0) {
    return 0;
  }
  if (n == 1) {
    return 1;
  }

  auto fib_prev = 0;
  auto fib = 1;
  for (int i = 2; i <= n; i++) {
    auto bkp = fib;

    fib = fib + fib_prev;
    fib_prev = bkp;

    // fib(i) == fib
  }
  return fib;
}

int do_fibonacci_rec(int n_wanted, int n_curr, int prev, int prev_prev) {
  if (n_curr == n_wanted) {
    return prev + prev_prev;
  } else {
    return do_fibonacci_rec(n_wanted, ++n_curr, prev + prev_prev, prev);
  }
}

int fibonacci_rec(int n) {
  if (n == 0) {
    return 0;
  }
  if (n == 1) {
    return 1;
  }

  return do_fibonacci_rec(n, 2, 1, 0);
}

int do_tribonacci_rec(int n_wanted, int n_curr, int prev, int prev_prev,
                      int prev_prev_prev) {
  if (n_curr == n_wanted) {
    return prev + prev_prev + prev_prev_prev;
  } else {
    return do_tribonacci_rec(
        n_wanted, ++n_curr, prev + prev_prev + prev_prev_prev, prev, prev_prev);
  }
}

int tribonacci_rec(int n) {
  if (n == 0) {
    return 0;
  }
  if (n == 1) {
    return 0;
  }
  if (n == 2) {
    return 1;
  }

  return do_tribonacci_rec(n, 3, 1, 0, 0);
}

int tribonacci(int n) {
  if (n == 0) {
    return 0;
  }
  if (n == 1) {
    return 0;
  }
  if (n == 2) {
    return 1;
  }

  auto fib_prev_prev = 0;
  auto fib_prev = 0;
  auto fib = 1;

  for (int i = 3; i <= n; i++) {
    auto fib_bkp = fib;
    auto fib_prev_bkp = fib_prev;

    fib = fib + fib_prev + fib_prev_prev;
    fib_prev = fib_bkp;
    fib_prev_prev = fib_prev_bkp;
  }
  return fib;
}

TEST(Fibo, Basic) {
  ASSERT_EQ(fibonacci(0), 0);
  ASSERT_EQ(fibonacci(1), 1);
  ASSERT_EQ(fibonacci(2), 1);
  ASSERT_EQ(fibonacci(3), 2);
  ASSERT_EQ(fibonacci(4), 3);
  ASSERT_EQ(fibonacci(5), 5);
  ASSERT_EQ(fibonacci(6), 8);
  ASSERT_EQ(fibonacci(7), 13);
  ASSERT_EQ(fibonacci(8), 21);
}

TEST(Fibo, Rec) {
  ASSERT_EQ(fibonacci_rec(0), 0);
  ASSERT_EQ(fibonacci_rec(1), 1);
  ASSERT_EQ(fibonacci_rec(2), 1);
  ASSERT_EQ(fibonacci_rec(3), 2);
  ASSERT_EQ(fibonacci_rec(4), 3);
  ASSERT_EQ(fibonacci_rec(5), 5);
  ASSERT_EQ(fibonacci_rec(6), 8);
  ASSERT_EQ(fibonacci_rec(7), 13);
  ASSERT_EQ(fibonacci_rec(8), 21);
}

TEST(Tribo, Basic) {
  ASSERT_EQ(tribonacci(0), 0);
  ASSERT_EQ(tribonacci(1), 0);
  ASSERT_EQ(tribonacci(2), 1);
  ASSERT_EQ(tribonacci(3), 1);
  ASSERT_EQ(tribonacci(4), 2);
  ASSERT_EQ(tribonacci(5), 4);
  ASSERT_EQ(tribonacci(6), 7);
  ASSERT_EQ(tribonacci(7), 13);
  ASSERT_EQ(tribonacci(8), 24);
}

TEST(Tribo, Rec) {
  ASSERT_EQ(tribonacci_rec(0), 0);
  ASSERT_EQ(tribonacci_rec(1), 0);
  ASSERT_EQ(tribonacci_rec(2), 1);
  ASSERT_EQ(tribonacci_rec(3), 1);
  ASSERT_EQ(tribonacci_rec(4), 2);
  ASSERT_EQ(tribonacci_rec(5), 4);
  ASSERT_EQ(tribonacci_rec(6), 7);
  ASSERT_EQ(tribonacci_rec(7), 13);
  ASSERT_EQ(tribonacci_rec(8), 24);
}
