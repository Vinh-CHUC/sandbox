def main():
    from playground.globals import mod, mod2
    mod.SOME_GLOBAL = 10
    print("Inside main:", mod.SOME_GLOBAL)
    mod.hello()
    mod2.hello()

if __name__ == "__main__":
    main()
