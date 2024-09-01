#[cfg(test)]
mod tests {
    fn basic<'a, 'b>(cond: bool, x: &'a str, _y: &'b str) -> &'a str {
        match cond {
            true => x,
            false => x, // This wouldn't compile as Rust cannot be statically sure that return value
                        // is indeed tied to the lifefime of x
                        // false => y
        }
    }

    #[derive(Debug)]
    struct MyStruct<'a, 'b> {
        x: &'a String,
        y: &'b String,
    }

    // fn level2(s: &String) -> MyStruct {
    //     let s = String::from("bar");
    //     return MyStruct {x: &s, y: &s};
    // }
    fn level1() {
        let x: MyStruct;
        let s = String::from("foo");
        {
            let t = String::from("bar");
            x = MyStruct { x: &s, y: &t };
            let _str_r = x.x;
            let _str_r = x.y;
        }
        ()
    }

    #[test]
    fn basic_test() {
        basic(true, "foo", "bar");
        level1()
    }
}
