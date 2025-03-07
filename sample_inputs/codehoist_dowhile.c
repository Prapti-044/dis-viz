#include <unistd.h>

int main(int argc, char **argv) {
    long total = 0;
    int a = 5, b = 10;

    int i = 0;
    do {
        int sum = (argc * a + b) / 2;
        int value = 0;

        int j = 0;
        do {
            value += sum + i * getpid();
            j++;
        } while (j < argc);

        total += value;
        i++;
    } while (i < 50000);

    return total;
}

