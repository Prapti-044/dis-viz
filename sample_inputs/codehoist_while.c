#include <unistd.h>

int main(int argc, char **argv) {
    long total = 0;
    int a = 5, b = 10;

    int i = 0;
    while (i < 50000) {
        int sum = (argc * a + b) / 2;
        int value = 0;

        int j = 0;
        while (j < argc) {
            value += sum + i * getpid();
            j++;
        }

        total += value;
        i++;
    }

    return total;
}

