import type { LabState, Issue, IssueStatus } from "../shared.js";
const el = <T extends HTMLElement = HTMLElement>(id: string) => {
  const value = document.getElementById(id);
  if (!value) throw new Error("Missing UI element: " + id);
  return value as T;
};
const escape = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
let state: LabState | undefined;
let selected = "";
let filter = "all";
let query = "";
let busy = false;
function feedback(text: string, error = false) {
  el("feedback").textContent = text;
  el("feedback").classList.toggle("error", error);
}
async function api(path: string, data?: object) {
  const response = await fetch(
    path,
    data
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Demo-Action": "1" },
          body: JSON.stringify(data),
        }
      : undefined,
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "The request could not complete.");
  return result;
}
function relative(timestamp: number) {
  const seconds = Math.max(0, Math.round(Date.now() / 1000 - timestamp));
  return seconds < 60
    ? "just now"
    : seconds < 3600
      ? Math.floor(seconds / 60) + "m ago"
      : Math.floor(seconds / 3600) + "h ago";
}
function currentIssue() {
  return state?.issues.find((issue) => issue.id === selected);
}
function renderIssues() {
  if (!state) return;
  const issues = state.issues.filter(
    (issue) =>
      (filter === "all" ||
        (filter === "active"
          ? issue.status !== "resolved"
          : issue.status === "resolved")) &&
      `${issue.title} ${issue.type} ${issue.service}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  el("issues").innerHTML = issues.length
    ? issues
        .map(
          (issue) =>
            `<button class="issue-row ${issue.id === selected ? "selected" : ""}" data-issue="${escape(issue.id)}" aria-pressed="${issue.id === selected}"><span class="issue-primary"><span class="severity ${issue.level}" aria-label="${issue.level}">${issue.level === "warning" ? "~" : "!"}</span><span class="issue-copy"><strong>${escape(issue.type)}</strong><span class="issue-message">${escape(issue.title)}</span><span class="issue-service">${escape(issue.service)} · ${relative(issue.lastSeen)}</span></span></span><span class="issue-count">${issue.count}</span><span class="issue-state ${issue.status}">${issue.status}</span></button>`,
        )
        .join("")
    : `<div class="empty"><strong>${state.issues.length ? "No matching issues." : "A clean slate."}</strong>${state.issues.length ? "Change the status filter or local search." : "Run a scenario to capture your first event."}</div>`;
}
function renderDetail() {
  const issue = currentIssue();
  const target = el("issue-detail");
  if (!issue) {
    target.innerHTML =
      '<div class="empty">Select an issue to inspect its safe event payload and stack frame.</div>';
    return;
  }
  const event = issue.events[0]!;
  const scenario = state!.scenarios.find((item) => item.id === issue.scenario)!;
  target.innerHTML = `<div class="detail-heading"><div><div class="detail-kicker">${escape(issue.id)} / EVENT DETAILS</div><h2>${escape(issue.title)}</h2></div><div class="detail-actions"><button class="button" data-status="${issue.status === "resolved" ? "open" : "resolved"}">${issue.status === "resolved" ? "Reopen issue" : "Mark resolved"}</button><button class="button quiet" data-recapture="${escape(issue.scenario)}">Capture again ↗</button></div></div><div class="detail-grid"><div class="code-panel"><div class="code-title">Scenario sketch <span>${escape(scenario.service)}</span></div><ol class="code-lines">${scenario.source.map((line) => `<li>${escape(line)}</li>`).join("")}</ol><div class="stack-frame">SDK frame: ${escape(event.frame.filename)}:${event.frame.line}<br>in ${escape(event.frame.function)}</div></div><div class="code-panel"><div class="code-title">Retained payload <span>Allowlisted fields only</span></div><pre id="payload"></pre></div></div><div class="detail-meta"><span>Events <strong>${issue.count}</strong></span><span>Latest release <strong>${escape(event.release)}</strong></span><span>First seen <strong>${relative(issue.firstSeen)}</strong></span><span>Transport <strong>local memory</strong></span></div>`;
  el("payload").textContent = JSON.stringify(event, null, 2);
}
function render() {
  if (!state) return;
  el("nav-count").textContent = String(state.issues.length);
  el("open-count").textContent = String(
    state.issues.filter((issue) => issue.status !== "resolved").length,
  );
  el("capture-count").textContent = String(state.totalCaptured);
  el("sdk-version").textContent = "Sentry Node SDK " + state.sdkVersion;
  el("retention").textContent =
    `${state.events.length} retained events · Last ${state.maxEvents} events in process memory · No external uploads`;
  if (!state.issues.some((issue) => issue.id === selected))
    selected = state.issues[0]?.id ?? "";
  renderIssues();
  renderDetail();
}
async function refresh() {
  state = (await api("/api/state")) as LabState;
  render();
}
async function capture(scenario?: string) {
  if (busy) return;
  busy = true;
  el<HTMLButtonElement>("capture").disabled = true;
  feedback("Capturing through the official SDK…");
  try {
    state = (await api("/api/capture", {
      scenario: scenario ?? el<HTMLSelectElement>("scenario").value,
      release: el<HTMLSelectElement>("release").value,
    })) as LabState;
    const issue = state.issues.find(
      (item) =>
        item.scenario === (scenario ?? el<HTMLSelectElement>("scenario").value),
    );
    selected = issue?.id ?? "";
    render();
    feedback(
      issue?.status === "regressed"
        ? "Regression detected. The resolved issue has received another event."
        : "Captured and grouped locally. Nothing was uploaded to Sentry.",
    );
  } catch (error) {
    feedback(error instanceof Error ? error.message : "Capture failed.", true);
  } finally {
    busy = false;
    el<HTMLButtonElement>("capture").disabled = false;
  }
}
function updateScenario() {
  el("scenario-description").textContent =
    state?.scenarios.find(
      (item) => item.id === el<HTMLSelectElement>("scenario").value,
    )?.description ?? "";
}
el("capture").addEventListener("click", () => {
  void capture();
});
el("scenario").addEventListener("change", updateScenario);
el<HTMLInputElement>("search").addEventListener("input", (event) => {
  query = (event.target as HTMLInputElement).value;
  renderIssues();
});
document.addEventListener("click", (event) => {
  const target = (event.target as Element).closest<HTMLButtonElement>("button");
  if (!target) return;
  if (target.dataset.nav) {
    document.querySelectorAll<HTMLElement>(".view").forEach((view) => {
      view.hidden = view.id !== "view-" + target.dataset.nav;
    });
    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.classList.toggle("active", button === target);
      button.setAttribute("aria-pressed", String(button === target));
    });
  }
  if (target.dataset.filter) {
    filter = target.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle("active", button === target);
      button.setAttribute("aria-pressed", String(button === target));
    });
    renderIssues();
  }
  if (target.dataset.issue) {
    selected = target.dataset.issue;
    renderIssues();
    renderDetail();
  }
  if (target.dataset.recapture) void capture(target.dataset.recapture);
  if (target.dataset.status && currentIssue())
    void (async () => {
      try {
        await api(`/api/issues/${currentIssue()!.id}/status`, {
          status: target.dataset.status as IssueStatus,
        });
        await refresh();
        feedback(
          target.dataset.status === "resolved"
            ? "Issue resolved. Capture the same scenario again to explore regression."
            : "Issue reopened.",
        );
      } catch (error) {
        feedback(
          error instanceof Error ? error.message : "Status update failed.",
          true,
        );
      }
    })();
});
el("reset").addEventListener("click", () => {
  void (async () => {
    try {
      await api("/api/reset", {});
      await refresh();
      feedback("Session cleared. All retained events have been discarded.");
    } catch (error) {
      feedback(error instanceof Error ? error.message : "Reset failed.", true);
    }
  })();
});
void (async () => {
  try {
    await refresh();
    el("scenario").innerHTML = state!.scenarios
      .map(
        (item) =>
          `<option value="${escape(item.id)}">${escape(item.title)}</option>`,
      )
      .join("");
    updateScenario();
  } catch (error) {
    el("issues").innerHTML =
      '<div class="empty"><strong>The local pipeline is unavailable.</strong>Reload after the server is running.</div>';
    feedback(error instanceof Error ? error.message : "Could not load.", true);
    el<HTMLButtonElement>("capture").disabled = true;
  }
})();
