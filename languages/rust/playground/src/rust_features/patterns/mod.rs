#[cfg(test)]
mod tests {
    #[test]
    fn basic() {
        let a = String::from("foo");
        match a.as_str() {
            "foo" => {}
            _ => {
                panic!("Failed tests");
            }
        }
    }
}
