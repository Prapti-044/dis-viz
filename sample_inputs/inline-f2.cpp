// demo_inline_chain.cpp
#include <bits/stdc++.h>
using namespace std;

// A handful of tiny functions that are good inlining candidates
double scale(double x, double a)          { return a * x; }
double shift(double x, double b)          { return x + b; }
double poly3(double x)                    { return ((x + 1.0) * x - 2.0) * x; } // cubic polynomial
double normalize(double x, double lo, double hi) { return (x - lo) / (hi - lo); }
double clamp01(double x)                  { return x < 0.0 ? 0.0 : (x > 1.0 ? 1.0 : x); }
double mix(double a, double b, double t)  { return a + t * (b - a); }

// A pipeline that nests many calls: clamp01(normalize(poly3(shift(scale(...)))))
double pipeline(double x) {
    // nested call within call within call (and then some):
    return clamp01(
        normalize(
            mix(
                poly3(shift(scale(x, 1.61803398875), -0.5)),
                poly3(shift(scale(x, -0.75),  0.25)),
                0.35
            ),
            -5.0, 5.0
        )
    );
}

int main() {
    constexpr size_t N = 1'000'000;
    vector<double> data; data.reserve(N);
    for (size_t i = 0; i < N; ++i) data.push_back(static_cast<double>(i) / N);

    // Compute through the nested pipeline to encourage inlining and vectorization at -O3
    double acc = 0.0;
    for (double x : data)
        acc += pipeline(x);

    // Prevent the optimizer from discarding the work
    cout << fixed << setprecision(6) << "Accumulated: " << acc << '\n';
}

