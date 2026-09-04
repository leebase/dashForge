import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardRenderer } from "../../components/DashboardRenderer";
import {
  createDashboardDataAdapter,
  type DashboardDataAdapterResolution,
} from "../../core/data/createDashboardDataAdapter";
import {
  findMaterialClaim,
  type ArtifactQualityDisclosure,
} from "../../core/data/SyntheticDataArtifactAdapter";
import type {
  DashboardMaterialClaim,
  DashboardSpec,
} from "../../core/spec/dashboardSpec";
import { resolveDashboardTheme } from "../../core/theme/themeRegistry";
import {
  collectDocumentStyles,
  escapeHtml,
  exportDashboardArtifact,
} from "../export/exportDashboard";
import {
  STORY_ARC_SECTION_KEYS,
  STORY_ARC_SECTION_LABELS,
  syncPresenterDraft,
} from "../presenter/narrativeStore";
import {
  describeClaimSource,
  loadIdleWarehousePresentation,
  type IdleWarehousePresentation,
} from "./idleWarehousePresentation";
import {
  FIELD_SERVICE_SHOWCASE_PACK_ID,
  FIELD_SERVICE_SHOWCASE_SCENARIO_ID,
  FIELD_SERVICE_SHOWCASE_TEMPLATE_ID,
} from "./fieldServiceShowcaseDashboard";
import {
  DEFAULT_STANDALONE_PACK_ID,
  DEFAULT_STANDALONE_SCENARIO_ID,
  DEFAULT_STANDALONE_TEMPLATE_ID,
  createDefaultStandaloneDashboardSpec,
} from "./standaloneDashboard";

interface StandaloneDashboardAppProps {
  initialSpec?: DashboardSpec;
  onOpenBuilder?: () => void;
}

type IdleWarehousePresentationState =
  | { status: "loading" }
  | { status: "ready"; presentation: IdleWarehousePresentation }
  | { status: "error"; error: string };

type FollowUpState =
  | { status: "idle" }
  | { status: "ready" }
  | { status: "error"; error: string };

type ExportState =
  | { status: "idle" }
  | { status: "ready" }
  | { status: "error"; error: string };

function resolveInitialSpec(initialSpec?: DashboardSpec) {
  const requestedScenario =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("scenario")
      : null;
  const sourceSpec =
    requestedScenario === DEFAULT_STANDALONE_SCENARIO_ID
      ? createDefaultStandaloneDashboardSpec()
      : initialSpec ?? createDefaultStandaloneDashboardSpec();

  return syncPresenterDraft(sourceSpec);
}

function narrativeSurfaceId(sectionKey: string): string {
  return sectionKey === "callToAction"
    ? "narrative:call-to-action"
    : `narrative:${sectionKey}`;
}

function ClaimCitation({
  claim,
}: {
  claim: DashboardMaterialClaim | undefined;
}) {
  if (!claim) {
    return null;
  }

  const fullSource = describeClaimSource(claim);
  const evidence = claim.source.evidence;
  const evidenceLabel =
    evidence.type === "assertion"
      ? "Verified assertion"
      : `Dataset evidence · ${evidence.datasetId}`;
  const compactDigest = `${claim.source.artifactDigest.slice(0, 15)}…`;

  return (
    <p className="standalone-claim-source">
      <span>Source</span>
      <code title={fullSource}>
        {evidenceLabel} · {compactDigest}
        <span className="standalone-claim-source__full">{fullSource}</span>
      </code>
    </p>
  );
}

function exportText(value: unknown): string {
  return escapeHtml(String(value ?? ""));
}

function syntheticDisclosureDetail(disclosure: string): string {
  return disclosure.replace(/^Synthetic demo data\s*[—-]\s*/i, "");
}

function buildExecutiveFollowUpHtml(input: {
  title: string;
  opportunityHigh?: number;
  idleWarehouseCount?: number;
  recommendations: ReadonlyArray<Record<string, unknown>>;
  disclosure: ArtifactQualityDisclosure;
}) {
  const recommendationItems = input.recommendations
    .map((row) => {
      const priority = exportText(row.executive_severity);
      const warehouse = exportText(row.scope_name);
      const action = exportText(row.recommended_action);
      const owner = exportText(row.suggested_owner);
      const guardrail = exportText(row.guardrail);
      const recommendationId = exportText(row.recommendation_id);

      return `<li><strong>${priority}</strong> · ${warehouse}: ${action} (owner validation: ${owner}; ${guardrail})<br /><small>Source: ${exportText(input.disclosure.artifactDigest)} · dataset observation recommendation_queue/${recommendationId}</small></li>`;
    })
    .join("");
  const limitations = input.disclosure.limitations
    .map((limitation) => `<li>${exportText(limitation)}</li>`)
    .join("");

  return `
    <section>
      <p><strong>Synthetic demo data</strong> — ${exportText(syntheticDisclosureDetail(input.disclosure.syntheticDisclosure))}</p>
      <p><strong>Controlled quality state:</strong> ${exportText(input.disclosure.summary)}</p>
      <p><strong>Upstream artifact:</strong> ${exportText(input.disclosure.artifactDigest)}</p>
      ${limitations ? `<ul>${limitations}</ul>` : ""}
      <p>Same-day executive follow-up for ${exportText(input.title)}.</p>
      <p>High-end monthly opportunity: <strong>${exportText(input.opportunityHigh ?? "n/a")}</strong> credits.</p>
      <p>Idle warehouse count requiring review: <strong>${exportText(input.idleWarehouseCount ?? "n/a")}</strong>.</p>
      <p>Cost concentration: FINANCE_REPORTING_WH dominates warehouse credits in the review window.</p>
      <h3>Prioritized recommendations (directional until validated)</h3>
      <ul>${recommendationItems}</ul>
      <p>Real/client mode remains disabled until approved metadata or exports exist.</p>
    </section>
  `;
}

function artifactResolutionErrors(
  resolution: DashboardDataAdapterResolution,
): string {
  return resolution.ok
    ? "Artifact-backed presentation could not be loaded."
    : resolution.errors.join("; ");
}

export function StandaloneDashboardApp({
  initialSpec,
  onOpenBuilder,
}: StandaloneDashboardAppProps = {}) {
  const [spec] = useState<DashboardSpec>(() => resolveInitialSpec(initialSpec));
  const [followUpState, setFollowUpState] = useState<FollowUpState>({
    status: "idle",
  });
  const [pdfExportState, setPdfExportState] = useState<ExportState>({
    status: "idle",
  });
  const [recommendationQueueOpen, setRecommendationQueueOpen] = useState(false);
  const dashboardStageRef = useRef<HTMLElement | null>(null);
  const recommendationQueueRef = useRef<HTMLElement | null>(null);
  const theme = resolveDashboardTheme(spec.theme);
  const adapterResult = useMemo(
    () => createDashboardDataAdapter(spec),
    [spec],
  );
  const packId = spec.intent.industry;
  const scenarioId = spec.intent.scenario ?? "";
  const datasetCount = adapterResult.datasets.length;
  const isIdleWarehouseWaste =
    packId === DEFAULT_STANDALONE_PACK_ID &&
    scenarioId === DEFAULT_STANDALONE_SCENARIO_ID;
  const isFieldServiceShowcase =
    packId === FIELD_SERVICE_SHOWCASE_PACK_ID &&
    scenarioId === FIELD_SERVICE_SHOWCASE_SCENARIO_ID;
  const templateId = isFieldServiceShowcase
    ? FIELD_SERVICE_SHOWCASE_TEMPLATE_ID
    : DEFAULT_STANDALONE_TEMPLATE_ID;
  const [presentationState, setPresentationState] =
    useState<IdleWarehousePresentationState>({ status: "loading" });
  const narrativeSections = spec.narrative
    ? STORY_ARC_SECTION_KEYS.map((sectionKey) => ({
        sectionKey,
        label: STORY_ARC_SECTION_LABELS[sectionKey],
        headline: spec.narrative!.storyArc[sectionKey].headline,
        claim: findMaterialClaim(spec, narrativeSurfaceId(sectionKey)),
      }))
    : [];

  useEffect(() => {
    if (!isIdleWarehouseWaste) {
      return;
    }
    if (!adapterResult.ok) {
      setPresentationState({
        status: "error",
        error: artifactResolutionErrors(adapterResult),
      });
      return;
    }

    let isCancelled = false;
    setPresentationState({ status: "loading" });
    void loadIdleWarehousePresentation(adapterResult.adapter, spec)
      .then((presentation) => {
        if (!isCancelled) {
          setPresentationState({ status: "ready", presentation });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setPresentationState({
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Artifact-backed presentation could not be loaded.",
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [adapterResult, isIdleWarehouseWaste, spec]);

  const buyerEvidence =
    presentationState.status === "ready"
      ? presentationState.presentation
      : undefined;
  const artifactDisclosure = adapterResult.artifact;

  function handleSameDayExecutiveFollowUp() {
    if (!buyerEvidence || !artifactDisclosure) {
      setFollowUpState({
        status: "error",
        error: "The governed artifact must be ready before export.",
      });
      return;
    }

    const dashboardHtml = buildExecutiveFollowUpHtml({
      title: spec.meta.title,
      opportunityHigh: buyerEvidence.opportunityHigh,
      idleWarehouseCount: buyerEvidence.idleWarehouseCount,
      recommendations: buyerEvidence.recommendations,
      disclosure: artifactDisclosure,
    });
    const exportInput = {
      spec,
      dashboardHtml,
      stylesHtml:
        typeof document !== "undefined" ? collectDocumentStyles(document) : "",
      includePresenterNotes: true,
    };

    if (typeof window === "undefined") {
      setFollowUpState({
        status: "error",
        error: "A browser window is required to export the follow-up artifact.",
      });
      return;
    }

    try {
      const result = exportDashboardArtifact(exportInput, window);
      if (!result.ok) {
        setFollowUpState({ status: "error", error: result.errors.join("; ") });
        return;
      }
      setFollowUpState({ status: "ready" });
    } catch (error) {
      setFollowUpState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "The follow-up artifact could not be exported.",
      });
    }
  }

  const qualityIsBlocking =
    !adapterResult.ok ||
    artifactDisclosure?.qualityState === "blocking" ||
    (isIdleWarehouseWaste && presentationState.status === "error");
  const presentationIsReady =
    !isIdleWarehouseWaste || presentationState.status === "ready";

  useEffect(() => {
    if (!recommendationQueueOpen || !buyerEvidence) {
      return;
    }

    const recommendationQueue = recommendationQueueRef.current;
    if (!recommendationQueue) {
      return;
    }

    recommendationQueue.focus({ preventScroll: true });
    if (typeof recommendationQueue.scrollIntoView === "function") {
      recommendationQueue.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [buyerEvidence, recommendationQueueOpen]);

  function handlePrintDashboard() {
    if (!adapterResult.ok || qualityIsBlocking || !presentationIsReady) {
      setPdfExportState({
        status: "error",
        error: "The verified dashboard must be ready before export.",
      });
      return;
    }

    const dashboardStage = dashboardStageRef.current;
    if (!dashboardStage) {
      setPdfExportState({
        status: "error",
        error: "The dashboard surface is not available for export.",
      });
      return;
    }

    if (typeof window === "undefined") {
      setPdfExportState({
        status: "error",
        error: "A browser window is required to print the dashboard.",
      });
      return;
    }

    try {
      const result = exportDashboardArtifact(
        {
          spec,
          dashboardHtml: dashboardStage.outerHTML,
          stylesHtml:
            typeof document !== "undefined" ? collectDocumentStyles(document) : "",
          includePresenterNotes: true,
        },
        window,
      );
      if (!result.ok) {
        setPdfExportState({ status: "error", error: result.errors.join("; ") });
        return;
      }
      setPdfExportState({ status: "ready" });
    } catch (error) {
      setPdfExportState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "The dashboard PDF print view could not be opened.",
      });
    }
  }

  return (
    <main
      className="app-shell standalone-shell"
      style={theme.cssVariables}
      data-testid={
        isIdleWarehouseWaste
          ? "idle-warehouse-waste-demo"
          : "standalone-dashboard"
      }
      data-demo={isIdleWarehouseWaste ? "idle-warehouse-waste" : scenarioId}
      data-scenario={scenarioId}
      data-readiness={qualityIsBlocking ? "blocking" : "controlled"}
    >
      <header className="hero standalone-hero">
        <div className="standalone-hero__copy">
          <p className="eyebrow">
            {isFieldServiceShowcase
              ? "Apex Climate Services · Heat-Wave Operating Review"
              : "DashForge Standalone MVP"}
          </p>
          <p
            className="standalone-provenance"
            data-disclosure="synthetic-demo-data"
            data-provenance="synthetic-demo-data"
          >
            <strong>Synthetic demo data</strong>
          </p>
          <h1>{spec.meta.title}</h1>
          <p className="lede">
            {spec.meta.description ??
              "Open directly into the current MVP scenario dashboard."}
          </p>
          <ClaimCitation
            claim={findMaterialClaim(spec, "narrative:dashboard-description")}
          />
          <p className="standalone-mode-note" data-mode="real-client-disabled">
            Real/client mode disabled — demo remains on the governed synthetic
            snapshot until approved metadata or exports exist.
          </p>
        </div>

        <section aria-label="Scenario package" className="standalone-summary">
          <p className="eyebrow">Scenario Package</p>
          <h2>{spec.meta.title}</h2>
          <dl className="standalone-meta">
            <div>
              <dt>Scenario</dt>
              <dd>
                {packId}:{scenarioId}
              </dd>
            </div>
            <div>
              <dt>Template</dt>
              <dd>{templateId}</dd>
            </div>
            <div>
              <dt>Datasets</dt>
              <dd>{datasetCount} verified bindings</dd>
            </div>
            <div>
              <dt>Upstream artifact</dt>
              <dd>
                <code>
                  {artifactDisclosure?.artifactDigest ?? "verification failed"}
                </code>
              </dd>
            </div>
          </dl>
          <p className="standalone-summary__note">
            A verified synthetic-data work package is consumed as a read-only
            snapshot through the shared DashboardSpec and DataAdapter path.
          </p>
          <div className="standalone-actions">
            {isIdleWarehouseWaste ? (
              <button
                aria-controls="recommendation-queue"
                aria-expanded={recommendationQueueOpen}
                className="button"
                data-action="open-recommendation-queue"
                data-testid="open-recommendation-queue"
                disabled={!adapterResult.ok || qualityIsBlocking}
                onClick={() => setRecommendationQueueOpen(true)}
                type="button"
              >
                {recommendationQueueOpen
                  ? "Recommendation queue opened"
                  : "Open recommendation queue"}
              </button>
            ) : null}
            {isIdleWarehouseWaste ? (
              <button
                className="button"
                data-testid="same-day-executive-follow-up"
                data-action="same-day-executive-follow-up"
                disabled={!buyerEvidence || qualityIsBlocking}
                onClick={handleSameDayExecutiveFollowUp}
                type="button"
              >
                Same-day executive follow-up
              </button>
            ) : null}
            <button
              className="button"
              data-testid="dashboard-save-pdf"
              disabled={!adapterResult.ok || qualityIsBlocking || !presentationIsReady}
              onClick={handlePrintDashboard}
              type="button"
            >
              Print / Save PDF
            </button>
            {onOpenBuilder ? (
              <button
                className="button button--ghost"
                onClick={onOpenBuilder}
                type="button"
              >
                Open Builder
              </button>
            ) : null}
          </div>
          {followUpState.status === "ready" ? (
            <p
              className="standalone-follow-up-status"
              data-testid="executive-follow-up-status"
              data-status="executive-follow-up"
              role="status"
            >
              Follow-up artifact is ready
            </p>
          ) : null}
          {followUpState.status === "error" ? (
            <p
              className="standalone-follow-up-status standalone-follow-up-status--error"
              data-testid="executive-follow-up-status"
              data-status="export-error"
              role="alert"
            >
              {followUpState.error}
            </p>
          ) : null}
          {pdfExportState.status === "ready" ? (
            <p
              className="standalone-follow-up-status"
              data-testid="dashboard-pdf-status"
              data-status="dashboard-pdf-ready"
              role="status"
            >
              Print view opened — choose “Save as PDF”
            </p>
          ) : null}
          {pdfExportState.status === "error" ? (
            <p
              className="standalone-follow-up-status standalone-follow-up-status--error"
              data-testid="dashboard-pdf-status"
              data-status="dashboard-pdf-error"
              role="alert"
            >
              {pdfExportState.error}
            </p>
          ) : null}
        </section>
      </header>

      <section
        aria-labelledby="standalone-quality-title"
        className={`standalone-quality standalone-quality--${
          qualityIsBlocking ? "blocking" : "controlled"
        }`}
        data-quality-state={qualityIsBlocking ? "blocking" : "controlled"}
        data-testid="synthetic-quality-disclosure"
        role={qualityIsBlocking ? "alert" : "status"}
      >
        <div>
          <p className="eyebrow">Data Readiness</p>
          <h2 id="standalone-quality-title">
            {qualityIsBlocking
              ? "Blocking synthetic-data quality"
              : "Controlled synthetic-data quality"}
          </h2>
        </div>
        <div className="standalone-quality__body">
          <p>
            <strong>Synthetic demo data</strong>
            <span>
              {artifactDisclosure
                ? syntheticDisclosureDetail(
                    artifactDisclosure.syntheticDisclosure,
                  )
                : "The staged synthetic work package could not be verified."}
            </span>
          </p>
          <p>
            {artifactDisclosure?.summary ??
              artifactResolutionErrors(adapterResult)}
          </p>
          {artifactDisclosure ? (
            <p className="standalone-quality__digest">
              {qualityIsBlocking ? "Staged artifact record" : "Verified upstream artifact"}{" "}
              <code>{artifactDisclosure.artifactDigest}</code>
            </p>
          ) : null}
          {artifactDisclosure?.limitations.length ? (
            <ul>
              {artifactDisclosure.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          ) : null}
          {!adapterResult.ok ? (
            <p>{adapterResult.errors.join("; ")}</p>
          ) : null}
          {presentationState.status === "error" ? (
            <p>{presentationState.error}</p>
          ) : null}
        </div>
      </section>

      {isIdleWarehouseWaste ? (
        <section
          aria-label="Idle warehouse waste evidence"
          className="standalone-evidence"
        >
          <div className="standalone-evidence__header">
            <p className="eyebrow">Buyer Evidence</p>
            <h2>Cost concentration and idle warehouse waste</h2>
          </div>
          {presentationState.status === "loading" ? (
            <p className="standalone-runtime-state" role="status">
              Resolving verified snapshot observations…
            </p>
          ) : null}
          {presentationState.status === "error" ? (
            <p className="standalone-runtime-state" role="alert">
              Buyer evidence is blocked: {presentationState.error}
            </p>
          ) : null}
          {buyerEvidence ? (
            <>
              <div className="standalone-evidence__grid">
                <article className="standalone-evidence__card">
                  <p className="standalone-evidence__label">
                    High-end monthly opportunity
                  </p>
                  <p className="standalone-evidence__value">
                    {buyerEvidence.opportunityHigh ?? "—"}
                  </p>
                  <p className="standalone-evidence__detail">
                    credits/month of idle warehouse waste opportunity
                    (directional until validated)
                  </p>
                  <ClaimCitation
                    claim={buyerEvidence.claimBySurfaceId.get(
                      "metric:monthly-opportunity-high",
                    )}
                  />
                </article>
                <article className="standalone-evidence__card">
                  <p className="standalone-evidence__label">
                    Idle warehouse count
                  </p>
                  <p className="standalone-evidence__value">
                    {buyerEvidence.idleWarehouseCount ?? "—"}
                  </p>
                  <p className="standalone-evidence__detail">
                    warehouses needing idle-policy owner validation
                  </p>
                  <ClaimCitation
                    claim={buyerEvidence.claimBySurfaceId.get(
                      "metric:idle-warehouse-count",
                    )}
                  />
                </article>
                <article className="standalone-evidence__card">
                  <p className="standalone-evidence__label">
                    Cost concentration
                  </p>
                  <p className="standalone-evidence__value">
                    FINANCE_REPORTING_WH
                  </p>
                  <p className="standalone-evidence__detail">
                    {buyerEvidence.financeShare !== undefined
                      ? `${buyerEvidence.financeShare}% of warehouse credits in the review window`
                      : "Dominant warehouse credit share in the review window"}
                  </p>
                  <ClaimCitation
                    claim={buyerEvidence.claimBySurfaceId.get(
                      "metric:cost-concentration",
                    )}
                  />
                </article>
              </div>
              <ul className="standalone-evidence__list">
                {buyerEvidence.warehouses.map((row) => (
                  <li key={String(row.name)}>
                    <strong>{String(row.name)}</strong>
                    {": auto-suspend "}
                    {String(row.auto_suspend ?? "n/a")}
                    {", technical owner "}
                    {String(row.technical_owner ?? "missing")}
                    {", monitor "}
                    {String(row.resource_monitor ?? "none")}
                  </li>
                ))}
              </ul>
              <ClaimCitation
                claim={buyerEvidence.claimBySurfaceId.get(
                  "metric:warehouse-controls",
                )}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {isIdleWarehouseWaste && recommendationQueueOpen ? (
        <section
          aria-label="Prioritized recommendations"
          className="standalone-recommendations"
          data-status="recommendation-queue"
          id="recommendation-queue"
          ref={recommendationQueueRef}
          role="region"
          tabIndex={-1}
        >
          <div className="standalone-recommendations__header">
            <p className="eyebrow">Action Queue</p>
            <h2>Prioritized recommendations</h2>
            <p>
              Recommendations are directional until validated. Require owner
              validation before changing warehouse availability or suspension
              policy.
            </p>
          </div>
          {buyerEvidence ? (
            <ol className="standalone-recommendations__list">
              {buyerEvidence.recommendations.map((row) => {
                const recommendationId = String(row.recommendation_id ?? "");
                return (
                  <li key={recommendationId || String(row.scope_name)}>
                    <div className="standalone-recommendations__item-head">
                      <span className="standalone-recommendations__priority">
                        {String(row.executive_severity ?? "")}
                      </span>
                      <strong>{String(row.scope_name ?? "")}</strong>
                      <span>{String(row.recommendation_type ?? "")}</span>
                    </div>
                    <p>{String(row.recommended_action ?? "")}</p>
                    <p>
                      Suggested owner:{" "}
                      {String(row.suggested_owner ?? "unassigned")} · Savings high{" "}
                      {String(
                        row.estimated_monthly_credit_savings_high ?? "n/a",
                      )}{" "}
                      credits · performance risk{" "}
                      {String(row.performance_risk ?? "review")}
                    </p>
                    <p className="standalone-recommendations__guardrail">
                      Safety: {String(row.guardrail ?? "Validate before change")}
                    </p>
                    <ClaimCitation
                      claim={buyerEvidence.claimBySurfaceId.get(
                        `recommendation:${recommendationId}`,
                      )}
                    />
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="standalone-runtime-state" role="status">
              Resolving verified recommendation observations…
            </p>
          )}
        </section>
      ) : null}

      {narrativeSections.length > 0 ? (
        <section
          aria-labelledby="standalone-storyboard-title"
          className="standalone-storyboard"
        >
          <div className="standalone-storyboard__header">
            <p className="eyebrow">Narrative Arc</p>
            <h2 id="standalone-storyboard-title">
              Walkthrough spine for the command-view conversation
            </h2>
          </div>

          <ol className="standalone-storyboard__list">
            {narrativeSections.map((section) => (
              <li
                className="standalone-storyboard__item"
                key={section.sectionKey}
              >
                <span>{section.label}</span>
                <strong>{section.headline}</strong>
                <ClaimCitation claim={section.claim} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {adapterResult.ok && presentationIsReady ? (
        <section
          className="standalone-dashboard-stage"
          ref={dashboardStageRef}
        >
          <DashboardRenderer
            adapter={adapterResult.adapter}
            presentation={{ showAnnotationLayer: true }}
            spec={spec}
          />
        </section>
      ) : (
        <section className="dashboard-box" aria-label="Standalone runtime state">
          <div
            className="dashboard-box__state"
            role={qualityIsBlocking ? "alert" : "status"}
          >
            {!adapterResult.ok
              ? adapterResult.errors.join("; ")
              : presentationState.status === "error"
                ? presentationState.error
                : "Resolving verified snapshot data…"}
          </div>
        </section>
      )}
    </main>
  );
}
