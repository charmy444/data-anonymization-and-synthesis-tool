# Scope Sprint 3: UI-first, Similar via SDV, Smart Anonymization

## Цель документа
Зафиксировать, что входит в Sprint 3 после закрытия MVP Sprint 2, а что переносится в Sprint 4 / optional.

## Основные продуктовые ветки
1. Main
2. Generate
3. Anonymize
4. Similar

## Main (входит в Sprint 3)
### Что пользователь получает
1. Отдельный frontend на `Next.js + TypeScript`.
2. Главную страницу с 3 сценариями: `Generate`, `Anonymize`, `Similar`.
3. Единый UI-стиль, анимации, переключение языка, переходы между ветками.

### Что входит в Sprint 3
- Отдельный frontend-проект в `frontend/`.
- Маршруты `/`, `/generate`, `/anonymize`, `/similar`.
- Общий layout, header, language toggle, единый визуальный стиль.

## Generate (входит в Sprint 3)
### Что пользователь делает
1. Выбирает один или несколько шаблонов.
2. Выбирает число строк и язык/регион датасета.
3. Получает CSV или ZIP на скачивание.

### Что входит в Sprint 3
- Перенос Generate в новый TypeScript frontend.
- Typed API-вызовы к backend.
- Показ всех доступных шаблонов и колонок.
- Скачивание результата через UI без Swagger.
- Улучшение правдоподобия сгенерированных данных:
  - более реалистичные города и адреса,
  - согласованность дат и связанных сущностей,
  - более правдоподобные распределения статусов, валют и количеств.

## Anonymize (входит в Sprint 3)
### Что пользователь делает
1. Загружает произвольный CSV.
2. Получает анализ колонок.
3. Видит suggested rules как стартовую точку.
4. При необходимости вручную меняет методы.
5. Скачивает анонимизированный CSV.

### Что входит в Sprint 3
- Улучшенный detector типов полей по имени и sample values.
- Suggester методов анонимизации:
  - `keep`
  - `pseudonymize`
  - `mask`
  - `redact`
  - `generalize_year`
- Интеграция upload -> analyze -> manual correction -> run -> download.
- Typed API-контракт между frontend и backend.

## Similar (входит в Sprint 3)
### Что пользователь делает
1. Загружает CSV.
2. Система анализирует структуру как single-table dataset.
3. Получает summary анализа и preview.
4. Задает размер результата.
5. Получает похожий synthetic CSV на скачивание.

### Что входит в Sprint 3
- Реализация `similar` через SDV, а не через ручную упрощенную генерацию.
- Pipeline `analyze -> fit -> sample`.
- Определение типов колонок и подготовка metadata для SDV.
- Semantic postprocess после sample.
- Выдача summary, warnings и downloadable CSV.

## Общий технологический фокус Sprint 3
1. Переход от встроенного backend UI к отдельному frontend на `TypeScript`.
2. Typed API client и типы ответа для `generate`, `anonymize`, `similar`.
3. Smart anonymization:
- detector;
- suggester;
- рекомендации методов после upload.
4. Similar data generation на базе `SDV`.
5. Semantic consistency для generated и similar data.

## Что показывается на Показе 3
1. Новый frontend и главный пользовательский сценарий без Swagger.
2. Generate:
- выбор шаблонов,
- настройка rows и языка,
- скачивание результата.
3. Anonymize:
- upload CSV,
- анализ колонок,
- suggested rules,
- ручная корректировка,
- скачивание результата.
4. Similar:
- upload CSV,
- summary анализа,
- генерация похожего CSV через SDV,
- скачивание результата.

## Перенос в Sprint 4 / optional
1. Batch processing через UI/API.
2. Async jobs и трекинг статусов выполнения.
3. Дополнительные result metadata и расширенные warnings.
4. Финальная регрессия/UAT перед защитой.
