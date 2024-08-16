#include "VString/VString.h"

#include <iostream>
 
int main(int argc, char *argv[])
{
    VString str("hello there");
    VString str2(std::move(str));
    std::cout << str2.move_assignment_count << std::endl;
    return 0;
}
