import Ajv from "ajv";

import { isKnownThemeId } from "../theme/themeRegistry";
import {
  CURRENT_DASHBOARD_SPEC_VERSION,
  isDatasetWidgetDataRef,
  type DashboardSpec,
} from "./dashboardSpec";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

const chartIntentValues = [
  "trend",
  "comparison",
  "composition",
  "distribution",
  "ranking",
  "target_vs_actual",
  "anomaly",
  "monitoring",
] as const;

const fieldEncodingSchema = {
  type: "object",
  properties: {
    field: { type: "string", minLength: 1 },
    label: { type: "string" },
    format: { type: "string" },
    sort: { enum: ["asc", "desc", "none"] },
    aggregate: { enum: ["sum", "avg", "min", "max", "count"] },
  },
  required: ["field"],
  additionalProperties: false,
} as const;

const dataFilterSchema = {
  type: "object",
  properties: {
    field: { type: "string", minLength: 1 },
    operator: {
      enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "between", "like"],
    },
    value: {},
  },
  required: ["field", "operator", "value"],
  additionalProperties: false,
} as const;

const datasetDataRefSchema = {
  type: "object",
  properties: {
    source: { const: "dataset" },
    datasetId: { type: "string", minLength: 1 },
    columns: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
    filters: {
      type: "array",
      items: dataFilterSchema,
    },
    groupBy: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
    metrics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string", minLength: 1 },
          aggregate: { enum: ["sum", "avg", "min", "max", "count"] },
          alias: { type: "string" },
        },
        required: ["field", "aggregate"],
        additionalProperties: false,
      },
    },
    limit: { type: "number" },
    offset: { type: "number" },
    sortBy: {
      type: "object",
      properties: {
        field: { type: "string", minLength: 1 },
        direction: { enum: ["asc", "desc"] },
      },
      required: ["field", "direction"],
      additionalProperties: false,
    },
  },
  required: ["source", "datasetId"],
  additionalProperties: false,
} as const;

const widgetPositionSchema = {
  type: "object",
  properties: {
    x: { type: "number" },
    y: { type: "number" },
    w: { type: "number" },
    h: { type: "number" },
    minW: { type: "number" },
    minH: { type: "number" },
    maxW: { type: "number" },
    maxH: { type: "number" },
  },
  required: ["x", "y", "w", "h"],
  additionalProperties: false,
} as const;

const annotationSchema = {
  type: "object",
  properties: {
    type: {
      enum: [
        "reference_line",
        "highlight_point",
        "highlight_region",
        "text_label",
      ],
    },
    value: { type: "number" },
    label: { type: "string", minLength: 1 },
    color: { type: "string" },
    style: { enum: ["solid", "dashed", "dotted"] },
  },
  required: ["type", "label"],
  additionalProperties: false,
} as const;

const chartOptionsSchema = {
  type: "object",
  properties: {
    showLegend: { type: "boolean" },
    showTooltip: { type: "boolean" },
    showGrid: { type: "boolean" },
    smooth: { type: "boolean" },
    stack: { type: "boolean" },
    horizontal: { type: "boolean" },
    innerRadius: { type: "number" },
    thresholds: {
      type: "array",
      items: {
        type: "object",
        properties: {
          value: { type: "number" },
          label: { type: "string", minLength: 1 },
          color: { type: "string" },
        },
        required: ["value", "label"],
        additionalProperties: false,
      },
    },
    colorPalette: { type: "string" },
    min: { type: "number" },
    max: { type: "number" },
  },
  additionalProperties: false,
} as const;

const baseWidgetSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    position: widgetPositionSchema,
    title: { type: "string", minLength: 1 },
    subtitle: { type: "string" },
    caption: { type: "string" },
    annotations: {
      type: "array",
      items: annotationSchema,
    },
  },
  required: ["id", "position", "title"],
} as const;

const cartesianInlinePayloadSchema = {
  type: "object",
  properties: {
    points: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", minLength: 1 },
          value: { type: "number" },
          series: { type: "string" },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    seriesLabel: { type: "string" },
    caption: { type: "string" },
  },
  required: ["points"],
  additionalProperties: false,
} as const;

const gaugeInlinePayloadSchema = {
  type: "object",
  properties: {
    value: { type: "number" },
    target: { type: "number" },
    min: { type: "number" },
    max: { type: "number" },
    prefix: { type: "string" },
    suffix: { type: "string" },
    label: { type: "string" },
    caption: { type: "string" },
  },
  required: ["value"],
  additionalProperties: false,
} as const;

const tableInlinePayloadSchema = {
  type: "object",
  properties: {
    columns: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          key: { type: "string", minLength: 1 },
          label: { type: "string" },
          format: { type: "string" },
          align: { enum: ["left", "center", "right"] },
        },
        required: ["key"],
        additionalProperties: false,
      },
    },
    rows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
    caption: { type: "string" },
  },
  required: ["columns", "rows"],
  additionalProperties: false,
} as const;

const inlineKpiDataRefSchema = {
  type: "object",
  properties: {
    source: { const: "inline" },
    payload: {
      type: "object",
      properties: {
        value: { type: "number" },
        delta: { type: "number" },
        deltaLabel: { type: "string" },
        suffix: { type: "string" },
        prefix: { type: "string" },
        caption: { type: "string" },
      },
      required: ["value"],
      additionalProperties: false,
    },
  },
  required: ["source", "payload"],
  additionalProperties: false,
} as const;

const inlineCartesianDataRefSchema = {
  type: "object",
  properties: {
    source: { const: "inline" },
    payload: cartesianInlinePayloadSchema,
  },
  required: ["source", "payload"],
  additionalProperties: false,
} as const;

const inlineGaugeDataRefSchema = {
  type: "object",
  properties: {
    source: { const: "inline" },
    payload: gaugeInlinePayloadSchema,
  },
  required: ["source", "payload"],
  additionalProperties: false,
} as const;

const inlineTableDataRefSchema = {
  type: "object",
  properties: {
    source: { const: "inline" },
    payload: tableInlinePayloadSchema,
  },
  required: ["source", "payload"],
  additionalProperties: false,
} as const;

function buildWidgetSchema(
  chartSchema: Record<string, unknown>,
  dataSchema: Record<string, unknown>,
) {
  return {
    allOf: [
      baseWidgetSchema,
      {
        type: "object",
        properties: {
          ...baseWidgetSchema.properties,
          chart: chartSchema,
          data: dataSchema,
        },
        required: ["id", "position", "title", "chart", "data"],
        additionalProperties: false,
      },
    ],
  } as const;
}

function buildCartesianChartSchema(type: string) {
  return {
    type: "object",
    properties: {
      type: { const: type },
      intent: { enum: chartIntentValues },
      encoding: {
        type: "object",
        properties: {
          x: fieldEncodingSchema,
          y: fieldEncodingSchema,
          series: fieldEncodingSchema,
        },
        required: ["x", "y"],
        additionalProperties: false,
      },
      options: chartOptionsSchema,
    },
    required: ["type", "encoding"],
    additionalProperties: false,
  } as const;
}

const kpiWidgetSchema = buildWidgetSchema(
  {
    type: "object",
    properties: {
      type: { const: "kpi" },
      intent: { enum: chartIntentValues },
      encoding: {
        type: "object",
        properties: {
          value: fieldEncodingSchema,
        },
        required: ["value"],
        additionalProperties: false,
      },
      kpiConfig: {
        type: "object",
        properties: {
          deltaField: { type: "string" },
          deltaLabel: { type: "string" },
          deltaFormat: { enum: ["percent", "absolute"] },
          deltaPositive: { enum: ["good", "bad"] },
          sparklineField: { type: "string" },
          prefix: { type: "string" },
          suffix: { type: "string" },
          format: { type: "string" },
        },
        additionalProperties: false,
      },
      options: chartOptionsSchema,
    },
    required: ["type", "encoding"],
    additionalProperties: false,
  },
  {
    oneOf: [inlineKpiDataRefSchema, datasetDataRefSchema],
  },
);

const lineWidgetSchema = buildWidgetSchema(
  buildCartesianChartSchema("line"),
  { oneOf: [inlineCartesianDataRefSchema, datasetDataRefSchema] },
);

const barWidgetSchema = buildWidgetSchema(
  buildCartesianChartSchema("bar"),
  { oneOf: [inlineCartesianDataRefSchema, datasetDataRefSchema] },
);

const stackedBarWidgetSchema = buildWidgetSchema(
  {
    type: "object",
    properties: {
      type: { const: "stacked_bar" },
      intent: { enum: chartIntentValues },
      encoding: {
        type: "object",
        properties: {
          x: fieldEncodingSchema,
          y: fieldEncodingSchema,
          series: fieldEncodingSchema,
        },
        required: ["x", "y", "series"],
        additionalProperties: false,
      },
      options: chartOptionsSchema,
    },
    required: ["type", "encoding"],
    additionalProperties: false,
  },
  { oneOf: [inlineCartesianDataRefSchema, datasetDataRefSchema] },
);

const donutWidgetSchema = buildWidgetSchema(
  {
    type: "object",
    properties: {
      type: { const: "donut" },
      intent: { enum: chartIntentValues },
      encoding: {
        type: "object",
        properties: {
          category: fieldEncodingSchema,
          value: fieldEncodingSchema,
        },
        required: ["category", "value"],
        additionalProperties: false,
      },
      options: chartOptionsSchema,
    },
    required: ["type", "encoding"],
    additionalProperties: false,
  },
  { oneOf: [inlineCartesianDataRefSchema, datasetDataRefSchema] },
);

const tableWidgetSchema = buildWidgetSchema(
  {
    type: "object",
    properties: {
      type: { const: "table" },
      intent: { enum: chartIntentValues },
      encoding: {
        type: "object",
        properties: {
          columns: {
            type: "array",
            minItems: 1,
            items: fieldEncodingSchema,
          },
        },
        required: ["columns"],
        additionalProperties: false,
      },
      options: chartOptionsSchema,
    },
    required: ["type", "encoding"],
    additionalProperties: false,
  },
  { oneOf: [inlineTableDataRefSchema, datasetDataRefSchema] },
);

const sparklineWidgetSchema = buildWidgetSchema(
  buildCartesianChartSchema("sparkline"),
  { oneOf: [inlineCartesianDataRefSchema, datasetDataRefSchema] },
);

const gaugeWidgetSchema = buildWidgetSchema(
  {
    type: "object",
    properties: {
      type: { const: "gauge" },
      intent: { enum: chartIntentValues },
      encoding: {
        type: "object",
        properties: {
          value: fieldEncodingSchema,
          target: fieldEncodingSchema,
          min: fieldEncodingSchema,
          max: fieldEncodingSchema,
          label: fieldEncodingSchema,
        },
        required: ["value"],
        additionalProperties: false,
      },
      gaugeConfig: {
        type: "object",
        properties: {
          min: { type: "number" },
          max: { type: "number" },
          prefix: { type: "string" },
          suffix: { type: "string" },
          format: { type: "string" },
        },
        additionalProperties: false,
      },
      options: chartOptionsSchema,
    },
    required: ["type", "encoding"],
    additionalProperties: false,
  },
  { oneOf: [inlineGaugeDataRefSchema, datasetDataRefSchema] },
);

const narrativeSectionSchema = {
  type: "object",
  properties: {
    headline: { type: "string", minLength: 1 },
    commentary: { type: "string", minLength: 1 },
    widgetIds: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 1,
    },
    transitionText: { type: "string" },
  },
  required: ["headline", "commentary", "widgetIds"],
  additionalProperties: false,
} as const;

const sha256DigestSchema = {
  type: "string",
  pattern: "^sha256:[0-9a-f]{64}$",
} as const;

const fileSha256Schema = {
  type: "string",
  pattern: "^sha256:[0-9a-f]{64}$",
} as const;

const artifactContextSchema = {
  type: "object",
  properties: {
    artifactType: { const: "synthetic-data-work-package" },
    payloadSchemaVersion: { const: "synthetic-data-work-package/1.0" },
    digest: sha256DigestSchema,
    employeeId: { const: "synthetic-data-story-engineer" },
    qualityReport: {
      type: "object",
      properties: {
        schemaVersion: { const: "data-quality-report/1.0" },
        path: { type: "string", minLength: 1 },
        sha256: fileSha256Schema,
      },
      required: ["schemaVersion", "path", "sha256"],
      additionalProperties: false,
    },
    snapshot: {
      type: "object",
      properties: {
        path: { type: "string", minLength: 1 },
        sha256: fileSha256Schema,
        datasetIds: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: { type: "string", minLength: 1 },
        },
      },
      required: ["path", "sha256", "datasetIds"],
      additionalProperties: false,
    },
    bindings: {
      type: "object",
      minProperties: 1,
      additionalProperties: {
        type: "object",
        properties: {
          snapshotDatasetId: { type: "string", minLength: 1 },
          fieldMap: {
            type: "object",
            minProperties: 1,
            additionalProperties: { type: "string", minLength: 1 },
          },
        },
        required: ["snapshotDatasetId", "fieldMap"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "artifactType",
    "payloadSchemaVersion",
    "digest",
    "employeeId",
    "qualityReport",
    "snapshot",
    "bindings",
  ],
  additionalProperties: false,
} as const;

const claimEvidenceSchema = {
  oneOf: [
    {
      type: "object",
      properties: {
        type: { const: "assertion" },
        assertionId: { type: "string", minLength: 1 },
      },
      required: ["type", "assertionId"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { const: "dataset_observation" },
        bindingId: { type: "string", minLength: 1 },
        datasetId: { type: "string", minLength: 1 },
        fields: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: { type: "string", minLength: 1 },
        },
        predicate: {
          type: "object",
          additionalProperties: {
            type: ["string", "number", "boolean", "null"],
          },
        },
      },
      required: ["type", "bindingId", "datasetId", "fields"],
      additionalProperties: false,
    },
  ],
} as const;

const dashboardGovernanceSchema = {
  type: "object",
  properties: {
    claimLedger: {
      type: "object",
      properties: {
        schemaVersion: { const: "dashboard-claim-ledger/1.0" },
        upstreamArtifactDigest: sha256DigestSchema,
        claims: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              claimId: { type: "string", minLength: 1 },
              surfaceId: { type: "string", minLength: 1 },
              kind: { enum: ["metric", "narrative", "recommendation"] },
              statement: { type: "string", minLength: 1 },
              source: {
                type: "object",
                properties: {
                  artifactDigest: sha256DigestSchema,
                  evidence: claimEvidenceSchema,
                },
                required: ["artifactDigest", "evidence"],
                additionalProperties: false,
              },
            },
            required: ["claimId", "surfaceId", "kind", "statement", "source"],
            additionalProperties: false,
          },
        },
      },
      required: ["schemaVersion", "upstreamArtifactDigest", "claims"],
      additionalProperties: false,
    },
    additionalMaterialSurfaceIds: {
      type: "array",
      uniqueItems: true,
      items: { type: "string", minLength: 1 },
    },
  },
  required: ["claimLedger", "additionalMaterialSurfaceIds"],
  additionalProperties: false,
} as const;

const dashboardSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    specVersion: { type: "string", minLength: 1 },
    meta: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1 },
        description: { type: "string" },
        author: { type: "string", minLength: 1 },
        createdAt: { type: "string", minLength: 1 },
        updatedAt: { type: "string", minLength: 1 },
        tags: {
          type: "array",
          items: { type: "string", minLength: 1 },
        },
      },
      required: ["title", "author", "createdAt", "updatedAt"],
      additionalProperties: false,
    },
    intent: {
      type: "object",
      properties: {
        type: {
          enum: [
            "executive_summary",
            "operational_detail",
            "risk_alert",
            "comparative_benchmark",
            "drill_down",
            "workshop_prototype",
          ],
        },
        audience: {
          enum: ["executive", "manager", "operator", "analyst", "client_demo"],
        },
        industry: { type: "string", minLength: 1 },
        scenario: { type: "string" },
      },
      required: ["type", "audience", "industry"],
      additionalProperties: false,
    },
    theme: {
      type: "object",
      properties: {
        id: { type: "string", minLength: 1 },
        overrides: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
    dataContext: {
      type: "object",
      properties: {
        mode: { enum: ["mock", "live", "hybrid", "artifact"] },
        mock: {
          type: "object",
          properties: {
            packId: { type: "string", minLength: 1 },
            scenarioId: { type: "string", minLength: 1 },
            seed: { type: "number" },
            overrides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  datasetId: { type: "string", minLength: 1 },
                  field: { type: "string", minLength: 1 },
                  value: {},
                },
                required: ["datasetId", "field", "value"],
                additionalProperties: false,
              },
            },
          },
          required: ["packId", "scenarioId", "seed"],
          additionalProperties: false,
        },
        live: {
          type: "object",
          properties: {
            bindings: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  type: {
                    enum: [
                      "rest",
                      "graphql",
                      "snowflake",
                      "databricks",
                      "static_json",
                    ],
                  },
                  connection: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      account: { type: "string" },
                      warehouse: { type: "string" },
                      database: { type: "string" },
                      schema: { type: "string" },
                      query: { type: "string" },
                      headers: {
                        type: "object",
                        additionalProperties: { type: "string" },
                      },
                    },
                    additionalProperties: false,
                  },
                  fieldMap: {
                    type: "object",
                    additionalProperties: { type: "string" },
                  },
                  refreshInterval: { type: "number" },
                  cachePolicy: { enum: ["none", "ttl"] },
                  cacheTTL: { type: "number" },
                },
                required: ["type", "connection", "fieldMap"],
                additionalProperties: false,
              },
            },
          },
          required: ["bindings"],
          additionalProperties: false,
        },
        artifact: artifactContextSchema,
        timeRange: {
          type: "object",
          properties: {
            start: { type: "string", minLength: 1 },
            end: { type: "string", minLength: 1 },
            granularity: { enum: ["day", "week", "month", "quarter"] },
          },
          required: ["start", "end", "granularity"],
          additionalProperties: false,
        },
      },
      required: ["mode", "timeRange"],
      additionalProperties: false,
    },
    layout: {
      type: "object",
      properties: {
        columns: { type: "number" },
        rowHeight: { type: "number" },
        breakpoints: {
          type: "object",
          properties: {
            lg: { type: "number" },
            md: { type: "number" },
            sm: { type: "number" },
          },
          required: ["lg", "md", "sm"],
          additionalProperties: false,
        },
        compaction: { enum: ["vertical", "horizontal", "none"] },
      },
      required: ["columns", "rowHeight", "breakpoints", "compaction"],
      additionalProperties: false,
    },
    widgets: {
      type: "array",
      minItems: 1,
      items: {
        oneOf: [
          kpiWidgetSchema,
          lineWidgetSchema,
          barWidgetSchema,
          stackedBarWidgetSchema,
          donutWidgetSchema,
          tableWidgetSchema,
          sparklineWidgetSchema,
          gaugeWidgetSchema,
        ],
      },
    },
    narrative: {
      type: "object",
      properties: {
        storyArc: {
          type: "object",
          properties: {
            hook: narrativeSectionSchema,
            context: narrativeSectionSchema,
            tension: narrativeSectionSchema,
            resolution: narrativeSectionSchema,
            callToAction: narrativeSectionSchema,
          },
          required: ["hook", "context", "tension", "resolution", "callToAction"],
          additionalProperties: false,
        },
        executiveSummary: { type: "string" },
        presenterNotes: {
          type: "array",
          items: { type: "string", minLength: 1 },
        },
      },
      required: ["storyArc"],
      additionalProperties: true,
    },
    governance: dashboardGovernanceSchema,
    filters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1 },
          label: { type: "string", minLength: 1 },
          field: { type: "string", minLength: 1 },
          operator: {
            enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "between", "like"],
          },
          value: {},
          applyToWidgetIds: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
        },
        required: ["id", "label", "field", "operator", "value"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "id",
    "specVersion",
    "meta",
    "intent",
    "theme",
    "dataContext",
    "layout",
    "widgets",
  ],
  additionalProperties: false,
} as const;

const validateStructure = ajv.compile(dashboardSchema);

export type DashboardSpecValidationResult =
  | { ok: true; spec: DashboardSpec }
  | { ok: false; errors: string[] };

function formatDate(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function validateSemanticRules(spec: DashboardSpec): string[] {
  const errors: string[] = [];

  if (spec.specVersion !== CURRENT_DASHBOARD_SPEC_VERSION) {
    errors.push(
      `Unsupported specVersion "${spec.specVersion}". Expected ${CURRENT_DASHBOARD_SPEC_VERSION}.`,
    );
  }

  if (!isKnownThemeId(spec.theme.id)) {
    errors.push(`Unknown theme.id "${spec.theme.id}".`);
  }

  const createdAt = formatDate(spec.meta.createdAt);
  const updatedAt = formatDate(spec.meta.updatedAt);
  const timeStart = formatDate(spec.dataContext.timeRange.start);
  const timeEnd = formatDate(spec.dataContext.timeRange.end);

  if (createdAt === null) {
    errors.push("meta.createdAt must be a valid date string.");
  }
  if (updatedAt === null) {
    errors.push("meta.updatedAt must be a valid date string.");
  }
  if (createdAt !== null && updatedAt !== null && createdAt > updatedAt) {
    errors.push("meta.updatedAt must be on or after meta.createdAt.");
  }
  if (timeStart === null || timeEnd === null) {
    errors.push("dataContext.timeRange must use valid date strings.");
  } else if (timeStart > timeEnd) {
    errors.push("dataContext.timeRange.start must be on or before timeRange.end.");
  }

  if (spec.dataContext.mode === "mock") {
    if (!spec.dataContext.mock) {
      errors.push('dataContext.mock is required when mode is "mock".');
    }
    if (spec.dataContext.live) {
      errors.push('dataContext.live must be omitted when mode is "mock".');
    }
  }

  if (spec.dataContext.mode === "live") {
    if (!spec.dataContext.live) {
      errors.push('dataContext.live is required when mode is "live".');
    }
    if (spec.dataContext.mock) {
      errors.push('dataContext.mock must be omitted when mode is "live".');
    }
  }

  if (spec.dataContext.mode === "hybrid") {
    if (!spec.dataContext.mock || !spec.dataContext.live) {
      errors.push("dataContext.hybrid mode requires both mock and live contexts.");
    }
  }

  if (spec.dataContext.mode === "artifact") {
    if (!spec.dataContext.artifact) {
      errors.push('dataContext.artifact is required when mode is "artifact".');
    }
    if (spec.dataContext.mock || spec.dataContext.live) {
      errors.push(
        'dataContext.mock and dataContext.live must be omitted when mode is "artifact".',
      );
    }
    if (!spec.governance) {
      errors.push('governance is required when dataContext.mode is "artifact".');
    }
  } else if (spec.dataContext.artifact) {
    errors.push('dataContext.artifact must be omitted unless mode is "artifact".');
  }

  if (spec.governance && spec.dataContext.artifact) {
    const artifactDigest = spec.dataContext.artifact.digest;
    const ledger = spec.governance.claimLedger;

    if (ledger.upstreamArtifactDigest !== artifactDigest) {
      errors.push("governance.claimLedger upstream digest must match the artifact digest.");
    }

    const claimIds = new Set<string>();
    const surfaceIds = new Set<string>();
    for (const claim of ledger.claims) {
      if (claimIds.has(claim.claimId)) {
        errors.push(`Duplicate material claim id "${claim.claimId}".`);
      }
      if (surfaceIds.has(claim.surfaceId)) {
        errors.push(`Duplicate material claim surface "${claim.surfaceId}".`);
      }
      if (claim.source.artifactDigest !== artifactDigest) {
        errors.push(`Material claim "${claim.claimId}" cites a different artifact digest.`);
      }
      claimIds.add(claim.claimId);
      surfaceIds.add(claim.surfaceId);
    }
  }

  if (spec.layout.columns <= 0) {
    errors.push("layout.columns must be greater than zero.");
  }
  if (spec.layout.rowHeight <= 0) {
    errors.push("layout.rowHeight must be greater than zero.");
  }
  if (
    !(
      spec.layout.breakpoints.lg > spec.layout.breakpoints.md &&
      spec.layout.breakpoints.md > spec.layout.breakpoints.sm
    )
  ) {
    errors.push("layout.breakpoints must descend from lg to md to sm.");
  }

  const widgetIds = new Set<string>();

  for (const widget of spec.widgets) {
    if (widgetIds.has(widget.id)) {
      errors.push(`Duplicate widget id "${widget.id}".`);
    }
    widgetIds.add(widget.id);

    const { position } = widget;
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.w <= 0 ||
      position.h <= 0 ||
      position.x + position.w > spec.layout.columns
    ) {
      errors.push(`Widget "${widget.id}" has impossible layout coordinates.`);
    }
    if (position.minW !== undefined && position.minW > position.w) {
      errors.push(`Widget "${widget.id}" minW exceeds its width.`);
    }
    if (position.minH !== undefined && position.minH > position.h) {
      errors.push(`Widget "${widget.id}" minH exceeds its height.`);
    }
    if (position.maxW !== undefined && position.maxW < position.w) {
      errors.push(`Widget "${widget.id}" maxW is smaller than its width.`);
    }
    if (position.maxH !== undefined && position.maxH < position.h) {
      errors.push(`Widget "${widget.id}" maxH is smaller than its height.`);
    }

    if (spec.dataContext.mode === "live" && isDatasetWidgetDataRef(widget.data)) {
      const binding = spec.dataContext.live?.bindings[widget.data.datasetId];
      if (!binding) {
        errors.push(
          `Widget "${widget.id}" references dataset "${widget.data.datasetId}" without a live binding.`,
        );
      }
    }
  }

  const filterIds = new Set<string>();
  for (const filter of spec.filters ?? []) {
    if (filterIds.has(filter.id)) {
      errors.push(`Duplicate filter id "${filter.id}".`);
    }
    filterIds.add(filter.id);

    for (const widgetId of filter.applyToWidgetIds ?? []) {
      if (!widgetIds.has(widgetId)) {
        errors.push(`Filter "${filter.id}" references unknown widget "${widgetId}".`);
      }
    }
  }

  const narrativeWidgetIds = [
    ...(spec.narrative?.storyArc.hook.widgetIds ?? []),
    ...(spec.narrative?.storyArc.context.widgetIds ?? []),
    ...(spec.narrative?.storyArc.tension.widgetIds ?? []),
    ...(spec.narrative?.storyArc.resolution.widgetIds ?? []),
    ...(spec.narrative?.storyArc.callToAction.widgetIds ?? []),
  ];

  for (const widgetId of narrativeWidgetIds) {
    if (!widgetIds.has(widgetId)) {
      errors.push(`Narrative references unknown widget "${widgetId}".`);
    }
  }

  return errors;
}

export function validateDashboardSpec(input: unknown): DashboardSpecValidationResult {
  if (!validateStructure(input)) {
    return {
      ok: false,
      errors:
        validateStructure.errors?.map((error) => {
          const path = error.instancePath || "/";
          return `${path} ${error.message}`.trim();
        }) ?? ["Dashboard spec structure is invalid."],
    };
  }

  const spec = input as DashboardSpec;
  const semanticErrors = validateSemanticRules(spec);

  if (semanticErrors.length > 0) {
    return {
      ok: false,
      errors: semanticErrors,
    };
  }

  return {
    ok: true,
    spec,
  };
}
