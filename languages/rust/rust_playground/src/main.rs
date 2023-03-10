mod iterators;
mod pointers;
mod oo;

use pointers::CustomSmartPointer;

fn main() {
    let _one = CustomSmartPointer{data: String::from("hi there")};
    let _two = CustomSmartPointer{data: String::from("como estas")};

    // Explicit destructor calls not allowed
    // one.drop();
}
