mod tests {
    #[cfg(test)]
    pub fn vec_factory() -> Vec<Vec<i32>> {
        (1..10)
            .into_iter()
            .map(|x| (1..x).into_iter().collect())
            .collect()
    }

    #[test]
    fn lambda_syntax() {
        // Need to explicitly annotate type otherwise the compiler cannot guess!!
        let _c1 = |x: u32| -> u32 { x + 1 };

        // No need
        let c2 = |x| x;
        assert_eq!(5, c2(5));

        // No need
        let c3 = |x| x + 1;
        assert_eq!(5, c3(4));

        let _c4 = || println!("Hiiiii!!");
    }

    #[test]
    fn lambda_captures() {
        // Note Rust is smart and will guess the type of capture!!!!

        // Move by default as usual
        {
            let list = vec![1, 2, 3];
            let c1 = |v| println!("{:?}", v);
            c1(list);
            // Cant access list here
            // println!("{:?}", list);
        }
        // Move to a mutable variable
        {
            let list = vec![1, 2, 3];
            let c1 = |mut v: Vec<_>| v.push(5);
            c1(list);
            // Cant access list here
            // println!("{:?}", list);
        }
        // By reference
        {
            let list = vec![1, 2, 3];
            let c1 = |v| println!("{:?}", v);

            // let c1 = |v: &_| println!("{:?}", v);
            // The reference declaration is optional actually as Rust infers from this line below
            c1(&list);

            println!("{:?}", list);
        }
        // By mutable reference
        {
            let mut list = vec![1, 2, 3];
            // The type annotation is not required
            let c1 = |v: &mut Vec<_>| println!("{:?}", v.push(10));
            // These works!!! The mutable reference is only very short lived within the lambda
            // So it never actually "interleaves" with list
            c1(&mut list);
            list.push(10);
            c1(&mut list);
        }
    }

    #[test]
    fn closure_captures() {
        // Immutable reference
        {
            let list = vec![1, 2, 3];
            let borrows = || println!("From closure: {:?}", list);

            println!("Before calling closure: {:?}", list);
            // list.push(5);  // Would not work if we had let mut list

            borrows(); // Note that the lifetimes of list and the closure capture do overlap
            println!("After calling closure: {:?}", list);
        }
        // Mutable reference
        {
            let mut list = vec![1, 2, 3];
            let mut borrows_mut = || list.push(5);
            borrows_mut(); // Note that the lifetimes of list and the closure capture do overlap
            // Another access to "list" here would have been forbidden
        }
        // Move
        {
            let list = vec![1, 2, 3];
            let moves = move || println!("{:?}", list);
            moves(); // Note that the lifetimes of list and the closure capture do overlap
            // Cant access list here
        }
    }

    #[test]
    fn for_loops() {
        // A for_loop implicitly calls into_iter(), which may yield T, &T or &mut T dependeing on
        // the context
        {
            // T
            let v1 = vec![1, 2, 3];
            for val in v1 {
                println!("{}", val);
            }
            // Can't access v1
        }
        {
            // &T
            let v1 = vec![1, 2, 3];
            for val in &v1 {
                println!("{}", val);
            }
            println!("{:?}", v1);
        }
        {
            // &mut T
            let mut v1 = vec![1, 2, 3];
            for val in &mut v1 {
                *val = 5;
            }
            assert_eq!(v1, vec![5, 5, 5]);
        }
    }

    #[test]
    fn explicit_iterators() {
        // &reference
        {
            let v1 = vec![1, 2, 3];
            let r: Vec<_> = v1.iter().map(|x| x + 1).collect();
            assert_eq!(r, vec![2, 3, 4]);
        }
        // &mut reference
        {
            let mut v1 = vec![1, 2, 3];
            // Not very idiomatic
            // v1.iter_mut().map(|x| {*x = 10}).collect::<()>();
            // Note we can do this again as the closures are contained in one line
            // v1.iter_mut().map(|x| {*x = 20}).collect::<()>();
            v1.iter_mut().for_each(|x| *x = 10);
            assert_eq!(v1, vec![10, 10, 10])
        }
        // Consuming the input
        {
            // {
            //      x = it.next();
            //      some_lambda(x);
            // }
            // Note that the move in front of the closure is not necessary!!
            let v = vec_factory();
            let r = v.into_iter().map(|x| x.len()).fold(0, |acc, el| acc + el);
            assert_eq!(r, 36);
        }
        // Consuming the input 2
        {
            let v = vec_factory();
            let r: Vec<Vec<i32>> = v
                .into_iter()
                .map(|x| x.into_iter().map(|y| -y).collect())
                .collect();
            assert!(r[0].is_empty());
            assert_eq!(r[1], vec![-1]);
            assert_eq!(r[2], vec![-1, -2]);
        }
    }
}
