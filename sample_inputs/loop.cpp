#include <iostream>
#include <cmath>

// Helper function to calculate the sum of digits of a number
int sumOfDigits(int num) {
    int sum = 0;
    while (num > 0) {
        sum += num % 10;
        num /= 10;
    }
    return sum;
}

int main() {
    // Outer loop 1
    for (int i = 2; i <= 6; i++) {
        // Loop 2
        for (int j = 1; j <= i + 2; j++) {
            if (i * j % 3 == 0) continue;  // Skip if i*j is divisible by 3

            // Loop 3
            for (int k = 1; k <= 5; k++) {
                // Calculate integer powers and use them
                int power1 = static_cast<int>(pow(i, 2));
                int power2 = static_cast<int>(pow(j, k));
                int result = (power1 + power2) % (k + 2);

                // Condition based on result and sum of digits
                if (result % 2 == 0 || sumOfDigits(i * j * k) < 5) continue;

                // Loop 4 with dynamic range based on previous loop variables
                for (int l = k + 1; l <= i + j; l++) {
                    if (l % (i + 1) == 0) continue;  // Skip if l is divisible by i+1

                    // Loop 5 with added condition
                    for (int m = 1; m <= 5; m++) {
                        int sumIndices = i + j + k + l + m;
                        int digitSum = sumOfDigits(sumIndices);

                        // Output only if certain complex conditions are met
                        if (result * digitSum > 50 && (m * l) % 3 == 1) {
                            std::cout << "i = " << i << ", j = " << j
                                      << ", k = " << k << ", l = " << l
                                      << ", m = " << m
                                      << " => Result = " << result
                                      << ", Sum of Indices = " << sumIndices
                                      << ", Sum of Digits = " << digitSum
                                      << std::endl;
                        }
                    }
                }
            }
        }
    }

    return 0;
}

