#include <iostream>

#include "MyString.h"

MyString::MyString(const std::string &str)
    : value(str), move_constructor_count(0), move_assignment_count(0) {
    std::cout << "Normal constructor" << std::endl;
}

const std::string& MyString::get() const {
    return value;
}

MyString::MyString(MyString&& other) noexcept: value(std::move(other.value)), move_assignment_count(0) {
    std::cout << "Move constructor" << std::endl;
    move_assignment_count++;
}
