"use client";

import { useMemo, useState } from "react";

import { DotGridBackground } from "@/components/dot-grid-background";
import { FullscreenLoaderOverlay } from "@/components/fullscreen-loader-overlay";
import { useLanguage } from "@/components/language-provider";
import { ApiError, runAnonymize, uploadAnonymizeFile } from "@/lib/api";
import type {
  AnonymizationRule,
  AnonymizeRunResponse,
  AnonymizeUploadResponse,
  UploadedCsvColumn,
} from "@/lib/api-types";
import { downloadBase64File } from "@/lib/download";

const methods: AnonymizationRule["method"][] = ["keep", "pseudonymize", "mask", "redact", "generalize_year"];

const copy = {
  ru: {
    eyebrow: "Anonymize",
    title: "Определяйте чувствительные колонки и анонимизируйте CSV",
    description: "",
    upload: "Загрузить CSV",
    uploadLimit: "Максимальный размер файла: 5 МБ",
    run: "Анонимизировать",
    running: "Обработка...",
    download: "Скачать CSV",
    result: "Результат",
    uploading: "Загрузка...",
    rows: "строк",
    columns: "колонок",
    uploadFailed: "Не удалось загрузить файл.",
    requestFailed: "Не удалось выполнить запрос.",
  },
  en: {
    eyebrow: "Anonymize",
    title: "Identify sensitive columns and anonymize CSVs",
    description: "",
    upload: "Upload CSV",
    uploadLimit: "Maximum file size: 5 MB",
    run: "Anonymize",
    running: "Processing...",
    download: "Download CSV",
    result: "Result",
    uploading: "Uploading...",
    rows: "rows",
    columns: "columns",
    uploadFailed: "Upload failed.",
    requestFailed: "Request failed.",
  },
} as const;

function methodLabel(method: string, language: "ru" | "en") {
  const labels: Record<"ru" | "en", Record<string, string>> = {
    ru: {
      keep: "оставить",
      pseudonymize: "псевдонимизировать",
      mask: "маскировать",
      redact: "скрыть",
      generalize_year: "оставить год",
    },
    en: {
      keep: "keep",
      pseudonymize: "pseudonymize",
      mask: "mask",
      redact: "redact",
      generalize_year: "generalize_year",
    },
  };
  return labels[language][method] ?? method;
}

export function AnonymizeFlow() {
  const { language } = useLanguage();
  const t = copy[language];
  const [upload, setUpload] = useState<AnonymizeUploadResponse | null>(null);
  const [rules, setRules] = useState<Record<string, AnonymizationRule["method"]>>({});
  const [result, setResult] = useState<AnonymizeRunResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderWord = isUploading ? "Uploading" : isRunning ? "Anonymizing" : null;

  const activeRules = useMemo(() => {
    if (!upload) {
      return [];
    }
    return upload.columns.map((column) => ({
      column_name: column.name,
      method: rules[column.name] ?? column.suggested_method ?? "keep",
      params: {},
    })) satisfies AnonymizationRule[];
  }, [rules, upload]);

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadAnonymizeFile(file);
      setUpload(response);
      setIsPreviewOpen(true);
      setRules(
        Object.fromEntries(
          response.columns.map((column) => [column.name, column.suggested_method ?? "keep"]),
        ),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRun = async () => {
    if (!upload) {
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await runAnonymize({
        upload_id: upload.upload_id,
        rules: activeRules,
      });
      setResult(response);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t.requestFailed);
    } finally {
      setIsRunning(false);
    }
  };

  const setMethod = (column: UploadedCsvColumn, method: AnonymizationRule["method"]) => {
    if (column.unsupported_methods[method]) {
      return;
    }
    setRules((current) => ({ ...current, [column.name]: method }));
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
          {!upload ? (
            <label className="upload-dropzone">
              <input type="file" accept=".csv,text/csv" onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)} />
              <span>{t.upload}</span>
              <small className="upload-dropzone__hint">{t.uploadLimit}</small>
            </label>
          ) : (
            <div className="surface-topbar">
              <div className="surface-meta surface-meta--compact">
                <span>{upload.file_name}</span>
                <span>{upload.row_count} {t.rows}</span>
                <span>{upload.column_count} {t.columns}</span>
              </div>
              <label className="surface-topbar__action">
                <input type="file" accept=".csv,text/csv" onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)} />
                <span>{language === "ru" ? "Загрузить другой файл" : "Upload another file"}</span>
              </label>
            </div>
          )}

          {error ? <p className="surface-error">{error}</p> : null}

          {upload ? (
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
                          {upload.columns.map((column) => (
                            <th key={column.name}>{column.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upload.preview_rows.map((row, index) => (
                          <tr key={index}>
                            {upload.columns.map((column) => (
                              <td key={column.name}>{row[column.name] ?? ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="column-list">
                {upload.columns.map((column) => (
                  <article key={column.name} className="column-card">
                    <div className="column-card__header column-card__header--stack">
                      <div>
                        <h2>{column.name}</h2>
                      </div>
                    </div>

                    <div className="method-row">
                      {methods.map((method) => (
                        <button
                          key={method}
                          type="button"
                          className={`method-button${(rules[column.name] ?? column.suggested_method ?? "keep") === method ? " is-active" : ""}`}
                          disabled={Boolean(column.unsupported_methods[method])}
                          title={column.unsupported_methods[method] ?? ""}
                          onClick={() => setMethod(column, method)}
                        >
                          {methodLabel(method, language)}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

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
