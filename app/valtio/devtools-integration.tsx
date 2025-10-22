/**
 * @fileoverview TanStack Devtools Integration for Valtio
 *
 * This file creates a custom devtools plugin for Valtio state using TanStack Devtools.
 * It displays real-time state snapshots, change history, and statistics.
 */

import { useEffect, useRef, useState } from "react";
import { TanStackDevtoolsCore } from "@tanstack/devtools";
import {
  getCurrentSnapshots,
  getStateStats,
  stateHistoryManager,
  subscribeToSnapshots,
  type StateChangeEvent,
} from "./devtools-monitor";

/**
 * Renders the Valtio devtools panel content
 */
function renderValtioPanel(container: HTMLDivElement, theme: "light" | "dark") {
  // Container setup
  container.className = "valtio-devtools-panel";
  container.style.cssText = `
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${theme === "dark" ? "#1a1a1a" : "#ffffff"};
    color: ${theme === "dark" ? "#e5e7eb" : "#1f2937"};
  `;

  // Create tabs
  const tabsContainer = document.createElement("div");
  tabsContainer.style.cssText = `
    display: flex;
    border-bottom: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
    background: ${theme === "dark" ? "#111827" : "#f9fafb"};
  `;

  const stateTab = document.createElement("button");
  const historyTab = document.createElement("button");

  const buttonStyle = (isActive: boolean) => `
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    background: transparent;
    cursor: pointer;
    color: ${
      isActive
        ? theme === "dark"
          ? "#14b8a6"
          : "#0d9488"
        : theme === "dark"
          ? "#9ca3af"
          : "#6b7280"
    };
    border-bottom: 2px solid ${isActive ? "#14b8a6" : "transparent"};
  `;

  stateTab.textContent = "Current State";
  stateTab.style.cssText = buttonStyle(true);

  historyTab.textContent = "History (0)";
  historyTab.style.cssText = buttonStyle(false);

  // Content container
  const contentContainer = document.createElement("div");
  contentContainer.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 1rem;
  `;

  let currentTab: "state" | "history" = "state";

  const renderContent = () => {
    contentContainer.innerHTML = "";

    if (currentTab === "state") {
      renderStateView(contentContainer, theme);
    } else {
      renderHistoryView(contentContainer, theme);
    }
  };

  stateTab.onclick = () => {
    currentTab = "state";
    stateTab.style.cssText = buttonStyle(true);
    historyTab.style.cssText = buttonStyle(false);
    renderContent();
  };

  historyTab.onclick = () => {
    currentTab = "history";
    stateTab.style.cssText = buttonStyle(false);
    historyTab.style.cssText = buttonStyle(true);
    renderContent();
  };

  tabsContainer.appendChild(stateTab);
  tabsContainer.appendChild(historyTab);
  container.appendChild(tabsContainer);
  container.appendChild(contentContainer);

  // Subscribe to updates
  const unsubscribeSnapshots = subscribeToSnapshots(() => {
    if (currentTab === "state") {
      renderContent();
    }
  });

  const unsubscribeHistory = stateHistoryManager.subscribe((history) => {
    historyTab.textContent = `History (${history.length})`;
    if (currentTab === "history") {
      renderContent();
    }
  });

  // Initial render
  renderContent();

  // Cleanup function
  return () => {
    unsubscribeSnapshots();
    unsubscribeHistory();
  };
}

function renderStateView(container: HTMLDivElement, theme: "light" | "dark") {
  const snapshots = getCurrentSnapshots();
  const stats = getStateStats();

  // Stats section
  const statsDiv = document.createElement("div");
  statsDiv.style.cssText = `
    background: ${theme === "dark" ? "#111827" : "#f3f4f6"};
    border: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  `;
  statsDiv.innerHTML = `
    <h3 style="font-weight: 600; margin-bottom: 0.5rem;">State Statistics</h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
      <div>
        <div style="font-size: 0.75rem; color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};">Documents</div>
        <div style="font-size: 1.5rem; font-weight: bold; color: #14b8a6;">${stats.documentCount}</div>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};">Workspaces</div>
        <div style="font-size: 1.5rem; font-weight: bold; color: #14b8a6;">${stats.workspaceCount}</div>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};">Total Pages</div>
        <div style="font-size: 1.5rem; font-weight: bold; color: #14b8a6;">${stats.totalPages}</div>
      </div>
    </div>
  `;

  container.appendChild(statsDiv);

  // Documents state
  const docsDiv = document.createElement("div");
  docsDiv.style.cssText = `
    border: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  `;

  const documentsData = snapshots.documents
    ? Array.from(
        snapshots.documents.entries() as IterableIterator<[any, any]>
      ).map(([key, value]) => ({
        id: key,
        ...value,
      }))
    : [];

  docsDiv.innerHTML = `
    <div style="background: ${theme === "dark" ? "#111827" : "#f9fafb"}; padding: 0.75rem; font-weight: 600;">
      Documents State
    </div>
    <div style="padding: 0.75rem; max-height: 16rem; overflow: auto;">
      <pre style="font-size: 0.75rem; white-space: pre-wrap; margin: 0;">${JSON.stringify(documentsData, null, 2)}</pre>
    </div>
  `;

  container.appendChild(docsDiv);

  // Workspaces state
  const wsDiv = document.createElement("div");
  wsDiv.style.cssText = `
    border: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
    border-radius: 0.5rem;
  `;

  const workspacesData = snapshots.workspaces
    ? Array.from(
        snapshots.workspaces.entries() as IterableIterator<[any, any]>
      ).map(([key, value]) => ({
        id: key,
        ...value,
      }))
    : [];

  wsDiv.innerHTML = `
    <div style="background: ${theme === "dark" ? "#111827" : "#f9fafb"}; padding: 0.75rem; font-weight: 600;">
      Workspaces State
    </div>
    <div style="padding: 0.75rem; max-height: 16rem; overflow: auto;">
      <pre style="font-size: 0.75rem; white-space: pre-wrap; margin: 0;">${JSON.stringify(workspacesData, null, 2)}</pre>
    </div>
  `;

  container.appendChild(wsDiv);
}

function renderHistoryView(container: HTMLDivElement, theme: "light" | "dark") {
  const history = stateHistoryManager.getHistory();

  if (history.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: ${theme === "dark" ? "#9ca3af" : "#6b7280"}; padding: 2rem;">
        No state mutations yet. Interact with the app to see changes.
      </div>
    `;
    return;
  }

  const headerDiv = document.createElement("div");
  headerDiv.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  `;

  const countDiv = document.createElement("div");
  countDiv.style.cssText = `font-size: 0.875rem; color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};`;
  countDiv.textContent = `${history.length} mutations recorded`;

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear History";
  clearBtn.style.cssText = `
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    background: ${theme === "dark" ? "#7f1d1d" : "#fee2e2"};
    color: ${theme === "dark" ? "#fca5a5" : "#991b1b"};
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  `;
  clearBtn.onclick = () => stateHistoryManager.clear();

  headerDiv.appendChild(countDiv);
  headerDiv.appendChild(clearBtn);
  container.appendChild(headerDiv);

  const eventsContainer = document.createElement("div");
  eventsContainer.style.cssText =
    "display: flex; flex-direction: column; gap: 0.5rem;";

  history
    .slice()
    .reverse()
    .forEach((event: StateChangeEvent) => {
      const eventDiv = document.createElement("div");
      eventDiv.style.cssText = `
        border: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
        border-radius: 0.5rem;
        padding: 0.5rem;
      `;

      const timestamp = new Date(event.timestamp);
      const timeStr =
        timestamp.toLocaleTimeString() + "." + timestamp.getMilliseconds();

      const snapshotData =
        event.storeName === "documents"
          ? Array.from(
              event.snapshot.entries() as IterableIterator<[any, any]>
            ).map(([key, value]) => ({
              id: key,
              ...value,
            }))
          : Array.from(
              event.snapshot.entries() as IterableIterator<[any, any]>
            ).map(([key, value]) => ({
              id: key,
              ...value,
            }));

      eventDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
          <div style="font-weight: 500; font-size: 0.875rem;">${event.changeDescription}</div>
          <div style="font-size: 0.75rem; color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};">${timeStr}</div>
        </div>
        <div style="font-size: 0.75rem; background: ${theme === "dark" ? "#111827" : "#f9fafb"}; border-radius: 0.25rem; padding: 0.5rem; max-height: 8rem; overflow: auto;">
          <pre style="white-space: pre-wrap; margin: 0;">${JSON.stringify(snapshotData, null, 2)}</pre>
        </div>
      `;

      eventsContainer.appendChild(eventDiv);
    });

  container.appendChild(eventsContainer);
}

/**
 * ValtioDevtools Component
 *
 * @remarks
 * React wrapper component that manages the TanStack Devtools lifecycle.
 */
export function ValtioDevtools() {
  const containerRef = useRef<HTMLDivElement>(null);
  const devtoolsRef = useRef<TanStackDevtoolsCore | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize TanStack Devtools
    const devtools = new TanStackDevtoolsCore({
      config: {
        defaultOpen: false,
        position: "bottom-right",
      },
      plugins: [
        {
          id: "valtio",
          name: "Valtio State",
          render: (el, theme) => {
            renderValtioPanel(el, theme);
          },
        },
      ],
    });

    devtools.mount(containerRef.current);
    devtoolsRef.current = devtools;

    return () => {
      devtools.unmount();
    };
  }, []);

  return <div ref={containerRef} />;
}
