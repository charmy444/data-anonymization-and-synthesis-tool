export type ResultFormat = "csv_base64" | "zip_base64";

export type GenerateTemplateId = "users" | "orders" | "payments" | "products" | "support_tickets";
export type GenerateDomainId = "ecommerce" | "fintech" | "shops" | "logistics" | "education" | "crm";
export type FakerLocale = "ru_RU" | "en_US";

export type GenerateDomainSummary = {
  domain_id: GenerateDomainId;
  name: string;
  description: string;
};

export type GenerateTemplateSummary = {
  template_id: GenerateTemplateId;
  name: string;
  description?: string | null;
  preview_columns?: string[] | null;
};

export type GenerateTemplateDetail = GenerateTemplateSummary & {
  columns: Array<{
    name: string;
    description: string;
    example_value?: string | null;
    pii_expected: boolean;
  }>;
};

export type GenerateRunRequest = {
  items: Array<{
    template_id: GenerateTemplateId;
    row_count: number;
  }>;
  locale: FakerLocale;
  domain?: GenerateDomainId;
};

export type GenerateRunResponse = {
  result_format: ResultFormat;
  file_name: string;
  generated_files: Array<{
    template_id: GenerateTemplateId;
    file_name: string;
    row_count: number;
    content_type: string;
  }>;
  content_base64?: string | null;
  archive_base64?: string | null;
  total_rows: number;
  warnings: string[];
};

export type AnonymizationRule = {
  column_name: string;
  method: "keep" | "pseudonymize" | "mask" | "redact" | "generalize_year";
  params: Record<string, unknown>;
};

export type UploadedCsvColumn = {
  index: number;
  name: string;
  inferred_type: string;
  detected_type: string;
  sample_values: string[];
  null_ratio: number;
  unique_ratio: number;
  reason?: string | null;
  suggested_method?: AnonymizationRule["method"] | null;
  confidence: number;
  hint?: string | null;
  unsupported_methods: Partial<Record<AnonymizationRule["method"], string>>;
};

export type AnonymizeUploadResponse = {
  upload_id: string;
  file_name: string;
  row_count: number;
  column_count: number;
  columns: UploadedCsvColumn[];
  preview_rows: Array<Record<string, string | null>>;
  delimiter: string;
  encoding: string;
  warnings: string[];
};

export type AnonymizeRunResponse = {
  upload_id: string;
  file_name: string;
  row_count: number;
  column_count: number;
  result_format: "csv_base64";
  content_base64: string;
  applied_rules: AnonymizationRule[];
  warnings: string[];
};

export type SimilarColumnProfile = {
  name: string;
  inferred_type: string;
  null_ratio: number;
  unique_ratio: number;
  sample_values: string[];
};

export type SimilarAnalyzeResponse = {
  analysis_id: string;
  file_name: string;
  row_count: number;
  column_count: number;
  columns: SimilarColumnProfile[];
  preview_rows: Array<Record<string, string | null>>;
  summary: string[];
  warnings: string[];
};

export type SimilarRunResponse = {
  analysis_id: string;
  file_name: string;
  row_count: number;
  column_count: number;
  result_format: "csv_base64";
  content_base64: string;
  warnings: string[];
};
