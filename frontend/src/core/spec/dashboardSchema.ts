import Ajv, { JSONSchemaType } from "ajv";

import type { DashboardSpec } from "./dashboardSpec";

const dashboardSchema: JSONSchemaType<DashboardSpec> = {
  type: "object",
  additionalProperties: false,
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
  properties: {
    id: { type: "string", minLength: 1 },
    specVersion: { type: "string", const: "1.0" },
    meta: {
      type: "object",
      additionalProperties: false,
      required: ["title", "author", "createdAt", "updatedAt"],
      properties: {
        title: { type: "string", minLength: 1 },
        description: { type: "string", nullable: true },
        author: { type: "string", minLength: 1 },
        createdAt: { type: "string", minLength: 1 },
        updatedAt: { type: "string", minLength: 1 },
      },
    },
    intent: {
      type: "object",
      additionalProperties: false,
      required: ["type", "audience", "industry"],
      properties: {
        type: { type: "string", enum: ["executive_summary", "workshop_prototype"] },
        audience: { type: "string", enum: ["executive", "client_demo"] },
        industry: { type: "string", minLength: 1 },
        scenario: { type: "string", nullable: true },
      },
    },
    theme: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string", minLength: 1 },
      },
    },
    dataContext: {
      type: "object",
      additionalProperties: false,
      required: ["mode", "timeRange"],
      properties: {
        mode: { type: "string", const: "mock" },
        timeRange: {
          type: "object",
          additionalProperties: false,
          required: ["start", "end", "granularity"],
          properties: {
            start: { type: "string", minLength: 1 },
            end: { type: "string", minLength: 1 },
            granularity: { type: "string", enum: ["month", "quarter"] },
          },
        },
      },
    },
    layout: {
      type: "object",
      additionalProperties: false,
      required: ["columns", "rowHeight"],
      properties: {
        columns: { type: "integer", minimum: 1 },
        rowHeight: { type: "integer", minimum: 1 },
      },
    },
    widgets: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "position", "title", "chart", "data"],
        properties: {
          id: { type: "string", minLength: 1 },
          position: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y", "w", "h"],
            properties: {
              x: { type: "integer", minimum: 0 },
              y: { type: "integer", minimum: 0 },
              w: { type: "integer", minimum: 1 },
              h: { type: "integer", minimum: 1 },
            },
          },
          title: { type: "string", minLength: 1 },
          subtitle: { type: "string", nullable: true },
          chart: {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            properties: {
              type: { type: "string", const: "kpi" },
            },
          },
          data: {
            type: "object",
            additionalProperties: false,
            required: ["source", "payload"],
            properties: {
              source: { type: "string", const: "inline" },
              payload: {
                type: "object",
                additionalProperties: false,
                required: ["value"],
                properties: {
                  value: { type: "number" },
                  delta: { type: "number", nullable: true },
                  deltaLabel: { type: "string", nullable: true },
                  suffix: { type: "string", nullable: true },
                  prefix: { type: "string", nullable: true },
                  caption: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(dashboardSchema);

export function validateDashboardSpec(spec: unknown): {
  ok: true;
  spec: DashboardSpec;
} | {
  ok: false;
  errors: string[];
} {
  if (validate(spec)) {
    return { ok: true, spec };
  }

  return {
    ok: false,
    errors:
      validate.errors?.map((error) => {
        const location = error.instancePath || "/";
        return `${location} ${error.message ?? "is invalid"}`;
      }) ?? ["Unknown validation error"],
  };
}
