import Playground

def main : IO Unit :=
  IO.println s!"Hello, {hello}!"


#eval String.append "Hello, " "Lean!"
#eval 5
#eval String.append "it is " (if 1 > 2 then "hahah" else "hihi")
/- #eval String.append "it is" -/
