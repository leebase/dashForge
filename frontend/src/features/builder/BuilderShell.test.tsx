import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createFreshDraftForScenario } from "./templateInstantiation";
import { BuilderShell } from "./BuilderShell";

describe("BuilderShell", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("supports dashboard editing, annotations, presenter mode, and JSON import errors", async () => {
    render(<BuilderShell />);

    expect(screen.getByText("Prompt The Dashboard, Then Refine The Story")).toBeInTheDocument();
    expect(screen.getByText("Starter Dashboards")).toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText("Title")[0]!, {
      target: { value: "Workshop Command Center" },
    });
    expect(screen.getByDisplayValue("Workshop Command Center")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add Annotation/i }));
    expect(screen.getByDisplayValue("New presenter callout")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Stacked Bar/i }));
    expect((await screen.findAllByText("Activation Mix")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Present" }));
    expect(await screen.findByText("Presenter Mode")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "JSON I/O" }));
    fireEvent.change(screen.getByPlaceholderText("Paste a DashboardSpec document here."), {
      target: { value: "{bad json" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Load JSON Into Builder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/expected/i);
  });

  it("exports only the presenter dashboard stage by default", async () => {
    const write = vi.fn();
    const open = vi.spyOn(window, "open").mockImplementation(
      () =>
        ({
          document: {
            close: vi.fn(),
            open: vi.fn(),
            write,
          },
          focus: vi.fn(),
          print: vi.fn(),
        }) as unknown as Window,
    );

    render(<BuilderShell />);

    fireEvent.click(screen.getByRole("button", { name: "Present" }));
    expect(await screen.findByText("Presenter Mode")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Proposal Artifact" }));

    expect(open).toHaveBeenCalled();
    expect(write).toHaveBeenCalledTimes(1);

    const exportedMarkup = write.mock.calls[0]?.[0] ?? "";

    expect(exportedMarkup).toContain("proposal-export__dashboard");
    expect(exportedMarkup).not.toContain("Presenter Mode");
    expect(exportedMarkup).not.toContain("Previous");
    expect(exportedMarkup).not.toContain("Active Widgets");
    expect(exportedMarkup).not.toContain("Presenter Notes");
    expect(exportedMarkup).not.toContain(
      "Open with the main client outcome before reading the chart.",
    );
  });

  it("stages and applies an AI-generated candidate without bypassing the builder shell", async () => {
    const candidate = createFreshDraftForScenario("saas", "scaling-success");
    candidate.meta.title = "AI Renewal Deck";
    candidate.meta.updatedAt = candidate.meta.createdAt;

    const aiClient = {
      availability: {
        status: "configured" as const,
        providerLabel: "Claude",
        model: "claude-test",
      },
      generate: vi.fn().mockResolvedValue({
        ok: true as const,
        model: "claude-test",
        responseText: JSON.stringify(candidate),
      }),
    };

    render(<BuilderShell aiClient={aiClient} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Candidate" }));

    await waitFor(() => expect(aiClient.generate).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Staged Candidate", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("AI Renewal Deck")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply Candidate" }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "AI Renewal Deck" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Present" }));
    expect(await screen.findByText("Presenter Mode")).toBeInTheDocument();
  });

  it("blocks improve-current generation until the active draft validates cleanly", async () => {
    const aiClient = {
      availability: {
        status: "configured" as const,
        providerLabel: "Claude",
        model: "claude-test",
      },
      generate: vi.fn(),
    };

    render(<BuilderShell aiClient={aiClient} />);

    fireEvent.change(screen.getAllByLabelText("Title")[0]!, {
      target: { value: "" },
    });

    fireEvent.change(screen.getByLabelText("Mode"), {
      target: { value: "improve_current" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Candidate" }));

    expect(aiClient.generate).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        /Improve Current requires the active draft to validate cleanly first\./i,
      ),
    ).toHaveTextContent(
      "Improve Current requires the active draft to validate cleanly first.",
    );
  });

  it("surfaces dataset binding controls when switching into live mode", async () => {
    render(<BuilderShell />);

    fireEvent.change(screen.getByLabelText("Data Mode"), {
      target: { value: "live" },
    });

    expect(await screen.findByText("Data Bindings")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "executive_summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "monthly_summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "feature_adoption" })).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(/requires a REST endpoint URL/i);
  });

  it("shows a dataset-level error when renamed live fields leave required mappings incomplete", async () => {
    render(<BuilderShell />);

    fireEvent.change(screen.getByLabelText("Data Mode"), {
      target: { value: "live" },
    });

    fireEvent.change(screen.getByLabelText("monthly_summary Endpoint URL"), {
      target: { value: "https://example.test/monthly-summary" },
    });
    fireEvent.change(screen.getByLabelText("monthly_summary field arr"), {
      target: { value: "annualRevenue" },
    });

    const monthlySummaryEditor = screen
      .getByRole("heading", { name: "monthly_summary" })
      .closest("section");

    expect(monthlySummaryEditor).not.toBeNull();
    expect(within(monthlySummaryEditor!).getByText(/missing mappings: month/i)).toBeInTheDocument();
  });
});
