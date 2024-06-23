#include <iostream>
#include <string>

#include "MyString.h"

int main() {
    MyString str2(std::move(MyString(std::string("hi"))));
    std::cout << str2.get() << std::endl;
    std::cout << str2.move_assignment_count << std::endl;
    return 0;
}
