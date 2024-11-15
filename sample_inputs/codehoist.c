#include <unistd.h>

int main(int argc, char **argv) {
    long total = 0;
    int a = 5, b = 10;

    for (int i = 0; i < 50000; ++i) {
        int sum = (argc*a + b) / 2;
        int value = sum + i*getpid();
        total += value;
    }

    return total;
}
