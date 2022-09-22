from bisect import bisect_left

class KeyWrapper:
    def __init__(self, iterable, key):
        self.it = iterable
        self.key = key

    def __getitem__(self, i):
        return self.key(self.it[i])

    def __len__(self):
        return len(self.it)

def binary_search(a, x, lo=0, hi=None, key=lambda _x: _x, not_found=None):
    if hi is None: hi = len(a)
    pos = bisect_left(KeyWrapper(a, key=key), x, lo, hi)
    return pos if pos != hi and key(a[pos]) == x else not_found
