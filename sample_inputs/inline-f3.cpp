// chain_inline.cpp
#include <bits/stdc++.h>
using namespace std;

// Small functions forming a call chain
inline int f3(int x) {
    return x * x;   // last in chain
}

inline int f2(int x) {
    // calls f3 inside its definition
    return f3(x) + 1;
}

inline int f1(int x) {
    // calls f2 inside its definition
    return 2 * f2(x);
}

inline int f0(int x) {
    // calls f1 inside its definition
    return f1(x) - 3;
}

int main() {
    int n = 10;
    int result = 0;
    for (int i = 1; i <= n; ++i) {
        result += f0(i);
    }
    cout << "Result = " << result << "\n";
}

