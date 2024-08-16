#ifndef MYSTRING_H
#define MYSTRING_H

#include <string>
#include <iostream>

class VString {
    public:
        explicit VString(const std::string& str);

        VString(const VString& other) = default;
        VString(VString&& other) noexcept;

        VString& operator=(const VString& other) = default;
        VString& operator=(VString&& other) noexcept = default;

        ~VString() = default;

        const std::string& get() const;

        int move_constructor_count;
        int move_assignment_count;
    private:
        std::string value;
};

#endif // MYSTRING_H
