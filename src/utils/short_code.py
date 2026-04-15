import string
import random

DEFAULT_NUM = 6
ALPHABET = string.ascii_letters + string.digits


def generate_short_code(length: int = DEFAULT_NUM) -> str:
    return ''.join(random.choices(ALPHABET, k=length))
