// comprehensive_example.cpp
//
// This file is intentionally eclectic and slightly over-engineered to
// exercise C++ parsers. It is not an example of good design. :)
// It uses C++17/C++20-ish features.

#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <optional>
#include <utility>
#include <type_traits>
#include <functional>

// --- Macros ------------------------------------------------------------------

#define UNUSED(x) (void)(x)
#define LOG(msg) std::cout << "[LOG] " << msg << '\n'

#ifdef DEBUG_BUILD
#  define DEBUG_ONLY(x) x
#else
#  define DEBUG_ONLY(x)
#endif

// --- Forward declarations ----------------------------------------------------

namespace utils {
    struct Point;
    template <typename T>
    void print_vector(const std::vector<T>& v);
}

class Foo;        // forward-declared class
template <typename T>
class Box;        // forward-declared template

// --- Global variables & inline variables -------------------------------------

int legacy_global_counter = 0;
inline int modern_inline_counter = 0; // C++17 inline variable

// --- Enums -------------------------------------------------------------------

enum Color {
    Red,
    Green,
    Blue
};

enum class LogLevel : int {
    Info,
    Warning,
    Error
};

// --- Free functions with various forms --------------------------------------

void log_message(LogLevel level, const std::string& msg) {
    const char* prefix = "";
    switch (level) {
        case LogLevel::Info:    prefix = "[INFO] ";    break;
        case LogLevel::Warning: prefix = "[WARN] ";    break;
        case LogLevel::Error:   prefix = "[ERROR] ";   break;
    }
    std::cout << prefix << msg << '\n';
}

inline int add_inline(int a, int b) { // inline free function
    return a + b;
}

constexpr int square_constexpr(int x) { // constexpr free function
    return x * x;
}

[[nodiscard]] int might_fail(bool fail) { // attribute + optional return checking
    if (fail) {
        return -1;
    }
    return 0;
}

// trailing return type + noexcept
auto multiply(int a, int b) noexcept -> int {
    return a * b;
}

// overloaded functions
int overload_example(int x) {
    return x * 2;
}

double overload_example(double x) {
    return x * 0.5;
}

// function template
template <typename T>
T max_value(T a, T b) {
    return (a < b) ? b : a;
}

// explicit specialization for const char*
template <>
const char* max_value<const char*>(const char* a, const char* b) {
    return (std::string(a) < std::string(b)) ? b : a;
}

// --- Namespaces --------------------------------------------------------------

namespace math {
    inline int add(int a, int b) { return a + b; }
    constexpr int sub(int a, int b) { return a - b; }

    template <typename T>
    T clamp(T value, T min, T max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}

namespace utils {

    // Simple struct
    struct Point {
        double x{0.0};
        double y{0.0};

        Point() = default;
        Point(double x_, double y_) : x(x_), y(y_) {}

        // member function
        double length_squared() const {
            return x * x + y * y;
        }
    };

    // inline operator overload
    inline std::ostream& operator<<(std::ostream& os, const Point& p) {
        os << "Point(" << p.x << ", " << p.y << ")";
        return os;
    }

    // abstract base class
    class Printable {
    public:
        virtual ~Printable() = default;
        virtual void print(std::ostream& os) const = 0;
    };

    // class with virtual inheritance and constructor/destructor
    class Named : public virtual Printable {
    protected:
        std::string name_;

    public:
        Named() : name_("unnamed") {
            LOG("Named default constructor");
        }

        explicit Named(std::string name) : name_(std::move(name)) {
            LOG("Named param constructor");
        }

        // virtual destructor
        ~Named() override {
            LOG("Named destructor");
        }

        const std::string& name() const { return name_; }

        void print(std::ostream& os) const override {
            os << "Named(" << name_ << ")";
        }
    };

    // templated function declaration (definition after namespace)
    template <typename T>
    void print_vector(const std::vector<T>& v);
}

// definition of templated function
template <typename T>
void utils::print_vector(const std::vector<T>& v) {
    std::cout << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << v[i];
    }
    std::cout << "]\n";
}

// namespace alias
namespace ut = utils;

// --- Classes -----------------------------------------------------------------

// Simple class with different constructors, destructor and methods
class Foo {
    int value_;

public:
    Foo() : value_(0) {
        LOG("Foo default constructor");
    }

    explicit Foo(int v) : value_(v) {
        LOG("Foo int constructor");
    }

    Foo(const Foo& other) : value_(other.value_) { // copy constructor
        LOG("Foo copy constructor");
    }

    Foo(Foo&& other) noexcept : value_(other.value_) { // move constructor
        other.value_ = 0;
        LOG("Foo move constructor");
    }

    Foo& operator=(const Foo& other) { // copy assignment
        if (this != &other) {
            value_ = other.value_;
        }
        LOG("Foo copy assignment");
        return *this;
    }

    Foo& operator=(Foo&& other) noexcept { // move assignment
        if (this != &other) {
            value_ = other.value_;
            other.value_ = 0;
        }
        LOG("Foo move assignment");
        return *this;
    }

    ~Foo() { // destructor
        LOG("Foo destructor");
    }

    int value() const { return value_; }

    void set_value(int v) { value_ = v; }

    // const member function
    int increment(int amount) const {
        return value_ + amount;
    }

    // static member function
    static Foo create_with_double(int v) {
        return Foo(v * 2);
    }
};

// Interface-like abstract class
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual void draw() const = 0;
};

// Derived class with override
class Circle : public Shape {
    double radius_{};

public:
    Circle() = default;
    explicit Circle(double r) : radius_(r) {}

    double area() const override {
        constexpr double pi = 3.14159265358979323846;
        return pi * radius_ * radius_;
    }

    void draw() const override {
        std::cout << "Drawing Circle(radius=" << radius_ << ")\n";
    }

    double radius() const { return radius_; }
};

// Multiple inheritance example
class LabeledCircle : public Circle, public ut::Named {
public:
    LabeledCircle(std::string label, double radius)
        : Circle(radius)
        , ut::Named(std::move(label)) {}

    void draw() const override {
        std::cout << "Drawing LabeledCircle(name=" << name_
                  << ", radius=" << radius() << ")\n";
    }

    void print(std::ostream& os) const override {
        os << "LabeledCircle(name=" << name_ << ", radius=" << radius() << ")";
    }
};

// Class template
template <typename T>
class Box {
    T value_;

public:
    Box() = default;
    explicit Box(const T& v) : value_(v) {}
    explicit Box(T&& v) : value_(std::move(v)) {}

    const T& get() const { return value_; }
    void set(const T& v) { value_ = v; }
    void set(T&& v) { value_ = std::move(v); }

    // templated member function
    template <typename U>
    U cast_to() const {
        return static_cast<U>(value_);
    }
};

// Partial specialization for pointer types
template <typename T>
class Box<T*> {
    T* ptr_;

public:
    Box() : ptr_(nullptr) {}
    explicit Box(T* p) : ptr_(p) {}

    T* get() const { return ptr_; }
    void reset(T* p = nullptr) { ptr_ = p; }

    bool is_null() const { return ptr_ == nullptr; }
};

// Non-type template parameter
template <typename T, std::size_t N>
class FixedArray {
    T data_[N]{};

public:
    constexpr std::size_t size() const { return N; }

    T& operator[](std::size_t i) { return data_[i]; }
    const T& operator[](std::size_t i) const { return data_[i]; }
};

// Class with operator overloads and conversion operator
class Vec2 {
public:
    float x{0.0f};
    float y{0.0f};

    Vec2() = default;
    Vec2(float x_, float y_) : x(x_), y(y_) {}

    Vec2 operator+(const Vec2& other) const {
        return Vec2(x + other.x, y + other.y);
    }

    Vec2& operator+=(const Vec2& other) {
        x += other.x;
        y += other.y;
        return *this;
    }

    bool operator==(const Vec2& other) const {
        return x == other.x && y == other.y;
    }

    // conversion operator
    explicit operator bool() const {
        return x != 0.0f || y != 0.0f;
    }
};

inline std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    os << "Vec2(" << v.x << ", " << v.y << ")";
    return os;
}

// --- Anonymous namespace (internal linkage) ---------------------------------

namespace {
    int internal_state = 0;

    void internal_function() {
        ++internal_state;
        LOG("internal_function called");
    }
}

// --- Lambdas & higher-order functions ---------------------------------------

void process_numbers(const std::vector<int>& nums,
                     const std::function<void(int)>& func) {
    for (int n : nums) {
        func(n);
    }
}

// --- Main --------------------------------------------------------------------

int main() {
    log_message(LogLevel::Info, "Program started");

    // Simple function usage
    int x = add_inline(2, 3);
    int y = square_constexpr(4);
    LOG("x = " << x << ", y = " << y);

    // max_value template and specialization
    int m1 = max_value(10, 20);
    const char* s1 = "apple";
    const char* s2 = "banana";
    const char* m2 = max_value(s1, s2);
    LOG("m1 = " << m1 << ", m2 = " << m2);

    // Namespaces and struct usage
    ut::Point p1(3.0, 4.0);
    std::cout << "p1 = " << p1 << ", len^2 = " << p1.length_squared() << '\n';

    // Foo class
    Foo f1;
    Foo f2(42);
    Foo f3 = Foo::create_with_double(10);
    Foo f4 = f2;          // copy
    Foo f5 = std::move(f3);  // move
    f1.set_value(7);
    std::cout << "f1.increment(5) = " << f1.increment(5) << '\n';

    // Shapes and polymorphism
    Circle c(5.0);
    LabeledCircle lc("unit circle-ish", 1.0);

    Shape* s = &c;
    s->draw();
    std::cout << "circle area = " << s->area() << '\n';

    s = &lc;
    s->draw();
    std::cout << "labeled circle area = " << s->area() << '\n';

    ut::Named* named = &lc;
    named->print(std::cout);
    std::cout << '\n';

    // Box template
    Box<int> bi(10);
    std::cout << "Box<int> contains " << bi.get() << '\n';
    double casted = bi.cast_to<double>();
    std::cout << "Box<int> cast_to<double> = " << casted << '\n';

    int value = 123;
    Box<int*> bp(&value);
    if (!bp.is_null()) {
        std::cout << "Box<int*> points to " << *bp.get() << '\n';
    }

    // FixedArray template with non-type parameter
    FixedArray<int, 3> fa;
    fa[0] = 1;
    fa[1] = 2;
    fa[2] = 3;
    for (std::size_t i = 0; i < fa.size(); ++i) {
        std::cout << "fa[" << i << "] = " << fa[i] << '\n';
    }

    // Vec2 operator overloads and conversion
    Vec2 v1(1.0f, 2.0f);
    Vec2 v2(3.0f, 4.0f);
    Vec2 v3 = v1 + v2;
    v1 += v2;
    std::cout << "v3 = " << v3 << ", v1 = " << v1 << '\n';
    if (static_cast<bool>(v3)) {
        std::cout << "v3 is non-zero vector\n";
    }

    // math namespace usage
    int clamped = math::clamp(15, 0, 10);
    std::cout << "clamped 15 to [0,10] = " << clamped << '\n';

    // Lambdas and higher-order functions
    std::vector<int> nums{1, 2, 3, 4, 5};
    process_numbers(nums, [](int n) {
        std::cout << "Number: " << n << '\n';
    });

    int sum = 0;
    process_numbers(nums, [&sum](int n) {
        sum += n;
    });
    std::cout << "Sum = " << sum << '\n';

    // Generic lambda
    auto generic_lambda = [](auto&& a, auto&& b) {
        return a + b;
    };
    std::cout << "generic_lambda(1, 2) = " << generic_lambda(1, 2) << '\n';
    std::cout << "generic_lambda(std::string, std::string) = "
              << generic_lambda(std::string("hello "), std::string("world")) << '\n';

    // Optional and modern features
    std::optional<int> maybe = 42;
    if (maybe) {
        std::cout << "maybe = " << *maybe << '\n';
    }

    internal_function();
    std::cout << "internal_state = " << internal_state << '\n';

    // [[nodiscard]] example (intentionally ignoring result here)
    UNUSED(might_fail(false));

    log_message(LogLevel::Info, "Program exiting");
    return 0;
}

