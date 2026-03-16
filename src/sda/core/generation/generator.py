import json
from faker import Faker
from typing import List, Dict, Any

class DataGenerator:
    def __init__(self):
        self.faker = Faker()
        self.context: Dict[str, List[Any]] = {"user_id": [], "order_id": []}

    def generate_table(self, template_id: str, count: int) -> List[Dict]:
        path = f"src/sda/resources/templates/{template_id}.json"
        with open(path, 'r', encoding='utf-8') as f:
            template = json.load(f)
        
        rows = []
        for _ in range(count):
            row = {}
            for col in template["columns"]:
                provider = col["provider"]
                if provider == "context_ref":
                    ref_key = col["ref"]
                    row[col["name"]] = self.faker.random_element(self.context[ref_key]) if self.context[ref_key] else "N/A"
                else:
                    method = getattr(self.faker, provider)
                    val = method()
                    row[col["name"]] = val
                    if col["name"] in self.context:
                        self.context[col["name"]].append(val)
            rows.append(row)
        return rows