#include <iostream>

#include "VString.h"

VString::VString(const std::string &str)
    : move_constructor_count(0), move_assignment_count(0), value(str) {
    std::cout << "Normal constructor" << std::endl;
}

const std::string& VString::get() const {
    return value;
}

VString::VString(VString&& other) noexcept: move_assignment_count(0), value(std::move(other.value)) {
    std::cout << "Move constructor" << std::endl;
    move_assignment_count++;
}
