#include <iostream>
#include <vector>
#include <cmath>

double calculate_result(const std::vector<double> &vec, int iterations) {
    int size = vec.size();
    if (size == 0) {
        return NAN;
    }

    double sum = 0;
    for (int i = 0; i < size; ++i) {
        sum += vec[i];
    }
    double average = sum / size;

    double variance = 0;
    for (int i = 0; i < size; ++i) {
        variance += pow(vec[i] - average, 2);
    }
    variance /= size;

    double standard_deviation = sqrt(variance);

    int i, j, k;
    for (i = 0; i < iterations; ++i) {
        for (j = 0; j < iterations; ++j) {
            for (k = 0; k < iterations; ++k) {
                if (standard_deviation < 0.01) {
                    return standard_deviation;
                }
            }
            if (j % 10 == 0) {
                break;
            }
        }
        if (i % 100 == 0) {
            break;
        }
    }

    return standard_deviation;
}

int main() {
    int iterations;
    std::cin >> iterations;

    std::vector<double> vec = { 1.0, 2.0, 3.0, 4.0, 5.0 };
    double result = calculate_result(vec, iterations);
    std::cout << "Result: " << result << std::endl;

    return 0;
}