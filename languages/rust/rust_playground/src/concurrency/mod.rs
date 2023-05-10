#[cfg(test)]
mod tests {
    use std::thread;
    use std::time::Duration;
    use std::rc::Rc;
    use std::sync::mpsc;

    #[test]
    fn thread_basics() {
        let thread_one = thread::spawn(|| {
            for i in 1..10 {
                println!("Thread 1, step {}", i);
                thread::sleep(Duration::from_millis(1));
            }
        });

        let thread_two = thread::spawn(|| {
            for i in 1..20 {
                println!("Thread 2, step {}", i);
                thread::sleep(Duration::from_millis(1));
            }
        });

        thread_one.join().expect("thread one panicked");
        thread_two.join().expect("thread one panicked");
    }

    #[test]
    fn threads_cannot_capture_structs_that_arent_sync_send() {
        let _some_data = Rc::new(10);

        let _thread_one = thread::spawn(move || {
            // This does not compile as some_data does not implement send
            // println!("Some data: {}", some_data);
        });

        let thread_one = thread::spawn(|| {
            // This does not compile as some_data does not implement sync
            // println!("Some data: {}", some_data);
        });

        thread_one.join().expect("thread one panicked");
    }

    #[test]
    fn threads_cannot_send_messages_that_arent_sync_send() {
        let _some_data = Rc::new(10);
        let (tx, _rx) = mpsc::channel();

        let thread_one = thread::spawn(move || {
            // This does not compile
            // tx.send(some_data).unwrap();
            tx.send(5).unwrap();
        });

        thread_one.join().expect("thread one panicked");
    }
}
