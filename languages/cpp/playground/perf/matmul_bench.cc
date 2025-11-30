#include <sys/types.h>
#include <vector>

#include <benchmark/benchmark.h>


static void init_matrices(std::vector<double>& A,
                          std::vector<double>& B,
                          std::vector<double>& C,
                          long N) {
    A.assign(N * N, 1.0);
    B.assign(N * N, 2.0);
    C.assign(N * N, 3.0);
}

static void BM_MatMul_ijk(benchmark::State& state) {
    long N = state.range(0);
    std::vector<double> A, B, C;
    init_matrices(A, B, C, N);

    for (auto _ : state) {
        for (int i = 0; i < N; i++)
            for (int j = 0; j < N; j++)
                for (int k = 0; k < N; k++)
                    C[i*N + j] += A[i*N + k] * B[k*N + j];
    }
}
BENCHMARK(BM_MatMul_ijk)->Arg(128)->Arg(1024);


static void BM_MatMul_ikj(benchmark::State& state) {
    long N = state.range(0);
    std::vector<double> A, B, C;
    init_matrices(A, B, C, N);

    for (auto _ : state) {
        for (int i = 0; i < N; i++)
            for (int k = 0; k < N; k++)
                for (int j = 0; j < N; j++)
                    C[i*N + j] += A[i*N + k] * B[k*N + j];
    }
}
BENCHMARK(BM_MatMul_ikj)->Arg(128)->Arg(1024);


static void BM_MatMul_jik(benchmark::State& state) {
    long N = state.range(0);
    std::vector<double> A, B, C;
    init_matrices(A, B, C, N);

    for (auto _ : state) {
        for (int j = 0; j < N; j++)
            for (int i = 0; i < N; i++)
                for (int k = 0; k < N; k++)
                    C[i*N + j] += A[i*N + k] * B[k*N + j];
    }
}
BENCHMARK(BM_MatMul_jik)->Arg(128)->Arg(1024);

BENCHMARK_MAIN();
