import io
import zipfile
from collections.abc import Sequence
from typing import Any

from sda.core.domain.errors import GenerationError
from sda.core.generation.generator import DataGenerator
from sda.io.csv_write import write_csv_bytes


def _zip_generated_files(files: Sequence[dict[str, Any]]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
        for item in files:
            archive.writestr(item["file_name"], item["content"])
    return buffer.getvalue()


def generate_csv_use_case(
    items: list[dict[str, int]],
    *,
    delimiter: str = ",",
    generator: DataGenerator | None = None,
) -> dict[str, Any]:
    """Use case генерации CSV на уровне приложения.

    Пример входа:
    [
      {"template_id": "users", "row_count": 100},
      {"template_id": "orders", "row_count": 100}
    ]

    Возвращаемая структура готова для сериализации в `web/routers/generate.py`.
    """
    if not items:
        raise GenerationError("Нужно передать хотя бы один элемент генерации.")

    seen: set[str] = set()
    for item in items:
        template_id = item.get("template_id")
        if template_id in seen:
            raise GenerationError(f"Повторяющийся template_id в запросе: '{template_id}'")
        seen.add(template_id)

    data_generator = generator or DataGenerator()
    tables = data_generator.generate_tables(items)

    generated_files: list[dict[str, Any]] = []
    total_rows = 0
    for item in items:
        template_id = item["template_id"]
        rows = tables[template_id]
        csv_content = write_csv_bytes(rows, delimiter=delimiter)
        generated_files.append(
            {
                "template_id": template_id,
                "file_name": f"{template_id}.csv",
                "row_count": len(rows),
                "content_type": "text/csv",
                "content": csv_content,
            }
        )
        total_rows += len(rows)

    if len(generated_files) == 1:
        single = generated_files[0]
        return {
            "result_format": "single_csv",
            "file_name": single["file_name"],
            "total_rows": total_rows,
            "generated_files": generated_files,
            "content": single["content"],
            "archive_content": None,
        }

    archive = _zip_generated_files(generated_files)
    return {
        "result_format": "zip_archive",
        "file_name": "generated_bundle.zip",
        "total_rows": total_rows,
        "generated_files": generated_files,
        "content": None,
        "archive_content": archive,
    }
