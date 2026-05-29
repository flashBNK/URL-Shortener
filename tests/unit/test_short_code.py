import re

from utils.short_code import generate_short_code


def test_generate_short_code_returns_string():
    code = generate_short_code()
    assert isinstance(code, str)


def test_generate_short_code_has_correct_length():
    code = generate_short_code()

    assert len(code) == 6


def test_generate_short_code_contains_only_valid_symbols():
    code = generate_short_code()

    assert re.fullmatch(r"[a-zA-Z0-9]{6}", code)


def test_generate_short_code_generates_unique_values():
    codes = {generate_short_code() for _ in range(100)}

    assert len(codes) == 100