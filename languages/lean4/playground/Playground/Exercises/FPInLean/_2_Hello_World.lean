def hello : IO Unit := do
  let stdin ← IO.getStdin
  let stdout ← IO.getStdout
  stdout.putStrLn "Hi there?"
  let input ← stdin.getLine
  let name := input.dropRightWhile Char.isWhitespace

  stdout.putStrLn s!"Hello, {name}!"

def nTimes(action : IO Unit) : Nat → IO Unit
  | 0 => pure ()
  | n + 1 => do
    action
    nTimes action n


def greeting: IO Unit := do
  let englishGreeting := IO.println "Hello!"
  IO.println "Bonjour!"
  englishGreeting

/-                          -/
/- Cat clone implementation -/
/-                          -/

def bufsize : USize := 20 * 1024

/- partial: recursive on a input that is not smaller -/
partial def dump (stream: IO.FS.Stream) : IO unit := do
  let buf ← stream.read bufsize
  /- each case has an implicit do block -/
  if buf.isEmpty then
    pure ()
  else
    let stdout ← IO.getStdout
    stdout.write buf
    dump stream

def fileStream(filename: System.FilePath) : IO (Option IO.FS.Stream) := do
  let fileExists ← filename.pathExists 
  if not fileExists then
    let stderr ← IO.getStderr
    stderr.putStrLn s!"File not found: {filename}"
    pure none
  else
    let handle ← IO.FS.Handle.mk filename IO.FS.Mode.read
    pure (some (IO.FS.Stream.ofHandle handle))


#check dump

def main : IO Unit := 
  IO.println s!"Hello, cats!"
