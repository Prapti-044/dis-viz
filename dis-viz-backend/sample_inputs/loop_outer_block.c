#include <stdio.h>
#define unlikely(x) __builtin_expect((x), 0)

int main(int argc, char *argv[])
{
    int i, j;
    for (i = 0; i < 10000; i++)
        for (j = 0; j < 10000; j += argc)
        {
            if (unlikely(i * j == 900))
            {
                printf("Hello %d %d %d", i, j, argc);
            }
        }
    return 42;
}
