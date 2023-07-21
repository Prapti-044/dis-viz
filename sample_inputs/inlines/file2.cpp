#include "file1.cpp"

using namespace std;

void func2() {
    printf("Func2");
}

int main() {
    func1();
    func2();
    return 0;
}