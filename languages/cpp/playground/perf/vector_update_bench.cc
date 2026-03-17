#include <benchmark/benchmark.h>
#include <vector>

static void BM_VectorUpdate(benchmark::State &state) {
  const size_t N = state.range(0);

  std::vector<double> x(N, 1.0);
  std::vector<double> v(N, 0.5);
  const double dt = 0.01;

  for (auto _ : state) {
    for (size_t i = 0; i < N; ++i) {
      x[i] += v[i] * dt;
    }
    benchmark::DoNotOptimize(x.data());
    benchmark::ClobberMemory();
  }
}

BENCHMARK(BM_VectorUpdate)->RangeMultiplier(10)->Range(100, 1000000);

BENCHMARK_MAIN();
