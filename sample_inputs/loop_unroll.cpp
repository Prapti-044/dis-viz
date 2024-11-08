#include <iostream>
#include <vector>

int main() {
    std::vector<int> array = {1, 2, 3, 4, 5, 6, 7, 8};
    int sum = 0;
    
    // Standard loop
    for (size_t i = 0; i < array.size(); ++i) {
        sum += array[i];
    }

    std::cout << "Sum: " << sum << std::endl;
    return 0;
}

