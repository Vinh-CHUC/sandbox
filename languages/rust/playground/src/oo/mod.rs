#[cfg(test)]
mod tests {
    trait Character {
        fn attack(&self) -> String;
    }

    trait Wizard {
        fn attack(&self) -> String;
    }

    struct Player;

    impl Character for Player {
        fn attack(&self) -> String {
            return "Punch".to_owned();
        }
    }

    impl Wizard for Player {
        fn attack(&self) -> String {
            return "Fireball".to_owned();
        }
    }

    impl Player {
        fn attack(&self) -> String {
            return "Sword".to_owned();
        }
    }

    #[test]
    fn fully_qualified_syntax_for_disambiguation() {
        let p = Player;
        assert_eq!(p.attack(), "Sword".to_owned());
        assert_eq!(Wizard::attack(&p), "Fireball".to_owned());
        assert_eq!(Character::attack(&p), "Punch".to_owned());
    }
}
