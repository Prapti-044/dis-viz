#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Function declarations
void start();
void greet();
void askName();
string getName();
void processName(string name);
void displayLength(string name);
void reverseName(string name);
void toUpperCase(string name);
void toLowerCase(string name);
void countVowels(string name);
void displayAscii(string name);
void mathDemo();
int add(int a, int b);
int multiply(int a, int b);
void displayResults(int sum, int product);
void endProgram();

// ================== Function Definitions ===================

// Starting point of the chain
void start() {
    cout << "Starting program...\n";
    greet();
}

void greet() {
    cout << "Hello! Welcome to the function chaining demo.\n";
    askName();
}

void askName() {
    cout << "Please enter your name: ";
    string name = getName();
    processName(name);
}

string getName() {
    string name;
    getline(cin, name);
    return name;
}

void processName(string name) {
    cout << "\nProcessing your name...\n";
    displayLength(name);
    reverseName(name);
    toUpperCase(name);
    toLowerCase(name);
    countVowels(name);
    displayAscii(name);
    mathDemo();
    endProgram();
}

void displayLength(string name) {
    cout << "Length of your name: " << name.length() << "\n";
}

void reverseName(string name) {
    string reversed = name;
    reverse(reversed.begin(), reversed.end());
    cout << "Reversed name: " << reversed << "\n";
}

void toUpperCase(string name) {
    string upper = name;
    for (char &c : upper) c = toupper(c);
    cout << "Uppercase: " << upper << "\n";
}

void toLowerCase(string name) {
    string lower = name;
    for (char &c : lower) c = tolower(c);
    cout << "Lowercase: " << lower << "\n";
}

void countVowels(string name) {
    int count = 0;
    string vowels = "aeiouAEIOU";
    for (char c : name) {
        if (vowels.find(c) != string::npos) count++;
    }
    cout << "Number of vowels in your name: " << count << "\n";
}

void displayAscii(string name) {
    cout << "ASCII values of characters: ";
    for (char c : name) {
        cout << (int)c << " ";
    }
    cout << "\n";
}

void mathDemo() {
    cout << "\nMath demo:\n";
    int a = 5, b = 7;
    int sum = add(a, b);
    int product = multiply(a, b);
    displayResults(sum, product);
}

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

void displayResults(int sum, int product) {
    cout << "Sum = " << sum << ", Product = " << product << "\n";
}

void endProgram() {
    cout << "\nProgram finished. Goodbye!\n";
}

// ================== Main ===================
int main() {
    start();  // This triggers the entire chain
    return 0;
}

