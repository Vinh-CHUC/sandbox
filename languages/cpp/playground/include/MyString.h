#ifndef MYSTRING_H
#define MYSTRING_H

#include <string>
#include <iostream>

class MyString {
    public:
        explicit MyString(const std::string& str);

        MyString(const MyString& other) = default;
        MyString(MyString&& other) noexcept;

        MyString& operator=(const MyString& other) = default;
        MyString& operator=(MyString&& other) noexcept = default;

        ~MyString() = default;

        const std::string& get() const;

        int move_constructor_count;
        int move_assignment_count;
    private:
        std::string value;
};

#endif // MYSTRING_H
