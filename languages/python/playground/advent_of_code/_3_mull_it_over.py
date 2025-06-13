import re
from pathlib import Path

def get_data() -> str:
    s = (Path(__file__).parent / "_3_mull_it_over.dat").read_text()
    return s

def part1():
    matches = re.findall(r'mul *\( *(\d+) *, *(\d+) *\)', get_data(), flags=0)
    return sum(int(a)*int(b) for a,b in matches)
