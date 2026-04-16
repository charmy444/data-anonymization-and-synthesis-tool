"use client";

import { useMemo, useState } from "react";

import { DotGridBackground } from "@/components/dot-grid-background";
import { FullscreenLoaderOverlay } from "@/components/fullscreen-loader-overlay";
import { useLanguage } from "@/components/language-provider";
import { analyzeSimilarFile, ApiError, runSimilar } from "@/lib/api";
import type { SimilarAnalyzeResponse, SimilarRunResponse } from "@/lib/api-types";
import { downloadBase64File } from "@/lib/download";

const copy = {
  ru: {
    eyebrow: "Similar",
    title: "Загружайте произвольный CSV и получайте похожий синтетический датасет.",
    description: "",
    analyze: "Загрузить и проанализировать CSV",
    uploadLimit: "Максимальный размер файла: 5 МБ",
    run: "Сгенерировать похожий CSV",
    running: "Генерация...",
    download: "Скачать CSV",
    analyzing: "Анализ...",
    rows: "строк",
    columns: "колонок",
    result: "Результат",
    targetRows: "Размер результата",
    unique: "уникальных",
    analysisFailed: "Не удалось выполнить анализ.",
    synthesisFailed: "Не удалось сгенерировать результат.",
  },
  en: {
    eyebrow: "Similar",
    title: "Upload any CSV and produce a similar synthetic dataset.",
    description: "",
    analyze: "Upload and analyze CSV",
    uploadLimit: "Maximum file size: 5 MB",
    run: "Generate similar CSV",
    running: "Generating...",
    download: "Download CSV",
    analyzing: "Analyzing...",
    rows: "rows",
    columns: "columns",
    result: "Result",
    targetRows: "Result size",
    unique: "unique",
    analysisFailed: "Analysis failed.",
    synthesisFailed: "Synthesis failed.",
  },
} as const;

function localizeSummaryItem(item: string, language: "ru" | "en") {
  if (language === "ru") {
    return item;
  }

  const detectedColumnsMatch = item.match(/^Найдено колонок:\s*(.+)$/);
  if (detectedColumnsMatch) {
    return `Detected columns: ${detectedColumnsMatch[1]}`;
  }

  const inputRowsMatch = item.match(/^Строк во входном CSV:\s*(.+)$/);
  if (inputRowsMatch) {
    return `Rows in input CSV: ${inputRowsMatch[1]}`;
  }

  const primaryKeyMatch = item.match(/^Первичный ключ SDV:\s*(.+)$/);
  if (primaryKeyMatch) {
    return `Primary key: ${primaryKeyMatch[1]}`;
  }

  return item;
}

export function SimilarFlow() {
  const { language } = useLanguage();
  const t = copy[language];
  const [analysis, setAnalysis] = useState<SimilarAnalyzeResponse | null>(null);
  const [result, setResult] = useState<SimilarRunResponse | null>(null);
  const [targetRows, setTargetRows] = useState(500);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderWord = isAnalyzing ? "Analyzing" : isRunning ? "Generating" : null;

  const summaryItems = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return analysis.summary.map((item) => localizeSummaryItem(item, language));
  }, [analysis, language]);

  const handleAnalyze = async (file: File | null) => {
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeSimilarFile(file, { previewRowsLimit: 5 });
      setAnalysis(response);
      setIsPreviewOpen(true);
      setTargetRows(response.row_count);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t.analysisFailed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRun = async () => {
    if (!analysis) {
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await runSimilar({
        analysis_id: analysis.analysis_id,
        target_rows: targetRows,
      });
      setResult(response);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t.synthesisFailed);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="tool-page tool-page--interactive">
      <FullscreenLoaderOverlay visible={Boolean(loaderWord)} word={loaderWord} />
      <div className="tool-page__background" aria-hidden="true">
        <DotGridBackground className="tool-page__dot-grid" />
      </div>
      <div className="tool-page__overlay" aria-hidden="true" />

      <section className="tool-page__hero page-container">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        {t.description ? <p>{t.description}</p> : null}
      </section>

      <section className="page-container tool-layout">
        <div className="tool-surface">
          {!analysis ? (
            <label className="upload-dropzone">
              <input type="file" accept=".csv,text/csv" onChange={(event) => void handleAnalyze(event.target.files?.[0] ?? null)} />
              <span>{t.analyze}</span>
              <small className="upload-dropzone__hint">{t.uploadLimit}</small>
            </label>
          ) : (
            <div className="surface-topbar">
              <div className="surface-meta surface-meta--compact">
                <span>{analysis.file_name}</span>
              </div>
              <label className="surface-topbar__action">
                <input type="file" accept=".csv,text/csv" onChange={(event) => void handleAnalyze(event.target.files?.[0] ?? null)} />
                <span>{language === "ru" ? "Загрузить другой файл" : "Upload another file"}</span>
              </label>
            </div>
          )}

          {error ? <p className="surface-error">{error}</p> : null}

          {analysis ? (
            <>
              <div className={`preview-panel${isPreviewOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="preview-panel__toggle"
                  onClick={() => setIsPreviewOpen((current) => !current)}
                >
                  <span>{language === "ru" ? "Превью первых строк" : "Preview first rows"}</span>
                  <span className="preview-panel__icon" aria-hidden="true">{isPreviewOpen ? "−" : "+"}</span>
                </button>
                <div className="preview-panel__body">
                  <div className="preview-table">
                    <table>
                      <thead>
                        <tr>
                          {analysis.columns.map((column) => (
                            <th key={column.name}>{column.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.preview_rows.map((row, index) => (
                          <tr key={index}>
                            {analysis.columns.map((column) => (
                              <td key={column.name}>{row[column.name] ?? ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="summary-list summary-list--stack">
                {summaryItems.map((item) => (
                  <div key={item} className="summary-list__item">
                    {item}
                  </div>
                ))}
              </div>

              <label className="input-block input-block--inline input-block--wide">
                <span className="field-label">{t.targetRows}</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={targetRows}
                  onChange={(event) => {
                    setResult(null);
                    setTargetRows(Math.min(10000, Math.max(1, Number(event.target.value) || 1)));
                  }}
                />
              </label>

              <button type="button" className="button button--primary tool-submit" onClick={handleRun} disabled={isRunning}>
                {t.run}
              </button>
            </>
          ) : null}
        </div>

        <aside className="tool-sidebar">
          {result ? (
            <article className="sidebar-card sidebar-card--result">
              <span className="field-label">{t.result}</span>
              <strong className="sidebar-card__big">{result.file_name}</strong>
              <div className="sidebar-list">
                <div className="sidebar-list__row">
                  <span>{t.rows}</span>
                  <strong>{result.row_count}</strong>
                </div>
                <div className="sidebar-list__row">
                  <span>{t.columns}</span>
                  <strong>{result.column_count}</strong>
                </div>
              </div>
              <button
                type="button"
                className="button button--primary button--wide sidebar-card__download"
                onClick={() => downloadBase64File(result.content_base64, result.file_name, "text/csv;charset=utf-8")}
              >
                {t.download}
              </button>
            </article>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
