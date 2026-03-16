import hashlib
from typing import List, Dict

class Anonymizer:
    def __init__(self):
        self._salt = "sda_secure_2026"

    def apply(self, value: str, method: str) -> str:
        if method == "keep": return value
        if method == "redact": return "[REDACTED]"
        if method == "mask":
            return f"{value[:2]}****{value[-2:]}" if len(value) > 4 else "****"
        if method == "pseudonymize":
            return hashlib.sha256((value + self._salt).encode()).hexdigest()[:10]
        if method == "generalize_year":
            return value[:4] if len(value) >= 4 else value
        return value

    def process_rows(self, rows: List[Dict], rules: Dict[str, str]) -> List[Dict]:
        return [{col: self.apply(str(val), rules.get(col, "keep")) for col, val in row.items()} for row in rows]