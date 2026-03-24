import pytest
from sda.core.anonymization.anonymizer import CsvAnonymizer
from sda.core.domain.errors import InvalidRuleError, UnknownColumnError

def test_anonymize_rows_stable_pseudonymization():
    """Проверка: одинаковый вход -> одинаковый выход (Stable Seed)."""
    anonymizer = CsvAnonymizer()
    rows = [
        {"user": "Artem", "email": "artem@example.com"},
        {"user": "Artem", "email": "artem@example.com"}
    ]
    rules = {
        "user": {"method": "pseudonymize"},
        "email": {"method": "pseudonymize"}
    }
    
    result = anonymizer.anonymize_rows(rows, rules)
    
    assert result[0]["user"] == result[1]["user"]
    assert result[0]["email"] == result[1]["email"]
    assert result[0]["user"] != "Artem"
    assert "@" in result[0]["email"]

def test_heuristics_detection():
    """Проверка: эвристики Faker (распознавание типов)."""
    anonymizer = CsvAnonymizer()
    
    assert anonymizer._detect_pseudonym_strategy(column_name="user_email", value="test@test.com") == "email"
    assert anonymizer._detect_pseudonym_strategy(column_name="phone_number", value="+79991234567") == "phone"
    
    assert anonymizer._detect_pseudonym_strategy(column_name="home_city", value="Moscow") == "name"

    assert anonymizer._detect_pseudonym_strategy(column_name="id", value="123") == "numeric_id"

def test_masking_variants():
    """Проверка логики маскирования для разных типов данных."""
    anonymizer = CsvAnonymizer()
    rows = [{"phone": "+79001112233", "text": "Secret"}]
    rules = {
        "phone": {"method": "mask"},
        "text": {"method": "mask"}
    }
    
    result = anonymizer.anonymize_rows(rows, rules)
    
    assert "*" in result[0]["phone"]
    assert result[0]["phone"].endswith("33")
    assert result[0]["text"].startswith("S")
    assert "*" in result[0]["text"]

def test_generalize_year_valid_and_invalid():
    """Проверка обобщения дат."""
    anonymizer = CsvAnonymizer()
    
    res = anonymizer.anonymize_rows([{"d": "1995-12-01"}], {"d": {"method": "generalize_year"}})
    assert res[0]["d"] == "1995"
    
    with pytest.raises(InvalidRuleError):
        anonymizer.anonymize_rows([{"d": "not-a-date"}], {"d": {"method": "generalize_year"}})

def test_error_on_unknown_column():
    """Движок должен ругаться на колонки, которых нет в данных."""
    anonymizer = CsvAnonymizer()
    with pytest.raises(UnknownColumnError):
        anonymizer.anonymize_rows([{"a": "1"}], {"b": {"method": "keep"}})
