/**
 * @fileoverview Valtio State Monitor
 *
 * This file implements a vanilla JS state monitoring system using valtio/vanilla.
 * It uses subscribe() to watch state changes and snapshot() to create immutable
 * snapshots for debugging purposes.
 *
 * Key concepts:
 * - subscribe() triggers callbacks on any state mutation
 * - snapshot() creates immutable copies of the proxy state
 * - State history tracking with timestamps
 * - Framework-agnostic vanilla JS approach
 */

import { subscribe, snapshot } from "valtio/vanilla";
import { documentsState } from "./documents.store";
import { workspacesState } from "./workspaces.store";

/**
 * State change event type
 */
export type StateChangeEvent = {
  timestamp: number;
  storeName: "documents" | "workspaces";
  snapshot: any;
  changeDescription: string;
};

/**
 * State history manager
 */
class StateHistoryManager {
  private history: StateChangeEvent[] = [];
  private maxHistorySize = 50;
  private listeners: Set<(history: StateChangeEvent[]) => void> = new Set();

  addChange(event: StateChangeEvent) {
    this.history.push(event);

    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    this.notifyListeners();
  }

  getHistory(): StateChangeEvent[] {
    return [...this.history];
  }

  clear() {
    this.history = [];
    this.notifyListeners();
  }

  subscribe(listener: (history: StateChangeEvent[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getHistory()));
  }
}

export const stateHistoryManager = new StateHistoryManager();

/**
 * Current state snapshots
 */
let currentDocumentsSnapshot: any = null;
let currentWorkspacesSnapshot: any = null;

/**
 * Snapshot listeners
 */
const snapshotListeners = new Set<() => void>();

function notifySnapshotListeners() {
  snapshotListeners.forEach((listener) => listener());
}

export function subscribeToSnapshots(listener: () => void) {
  snapshotListeners.add(listener);
  return () => snapshotListeners.delete(listener);
}

/**
 * Get current state snapshots
 */
export function getCurrentSnapshots() {
  return {
    documents: currentDocumentsSnapshot,
    workspaces: currentWorkspacesSnapshot,
  };
}

/**
 * Get state statistics
 */
export function getStateStats() {
  const docsSnap = currentDocumentsSnapshot;
  const wsSnap = currentWorkspacesSnapshot;

  return {
    documentCount: docsSnap ? docsSnap.size : 0,
    workspaceCount: wsSnap ? wsSnap.size : 0,
    totalPages: docsSnap
      ? Array.from(docsSnap.values()).reduce(
          (sum: number, doc: any) => sum + (doc.pages?.length || 0),
          0
        )
      : 0,
  };
}

/**
 * Initialize the state monitor
 *
 * @remarks
 * Sets up subscriptions to documentsState and workspacesState using
 * valtio/vanilla's subscribe() function. When state changes, it:
 * 1. Creates an immutable snapshot using snapshot()
 * 2. Records the change in history with timestamp
 * 3. Notifies any listeners
 *
 * This is the vanilla JS approach as recommended in Valtio docs.
 */
export function initializeStateMonitor() {
  console.log("[Devtools] Initializing Valtio state monitor (vanilla JS)");

  // Subscribe to documents state
  const unsubscribeDocuments = subscribe(documentsState, () => {
    // Create immutable snapshot
    const snap = snapshot(documentsState);
    currentDocumentsSnapshot = snap;

    console.log("[Devtools] Documents state mutated", {
      documentCount: snap.size,
    });

    // Add to history
    stateHistoryManager.addChange({
      timestamp: Date.now(),
      storeName: "documents",
      snapshot: snap,
      changeDescription: `Documents updated (${snap.size} documents)`,
    });

    notifySnapshotListeners();
  });

  // Subscribe to workspaces state
  const unsubscribeWorkspaces = subscribe(workspacesState, () => {
    // Create immutable snapshot
    const snap = snapshot(workspacesState);
    currentWorkspacesSnapshot = snap;

    console.log("[Devtools] Workspaces state mutated", {
      workspaceCount: snap.size,
    });

    // Add to history
    stateHistoryManager.addChange({
      timestamp: Date.now(),
      storeName: "workspaces",
      snapshot: snap,
      changeDescription: `Workspaces updated (${snap.size} workspaces)`,
    });

    notifySnapshotListeners();
  });

  // Initialize snapshots
  currentDocumentsSnapshot = snapshot(documentsState);
  currentWorkspacesSnapshot = snapshot(workspacesState);
  notifySnapshotListeners();

  // Return cleanup function
  return () => {
    console.log("[Devtools] Cleaning up state monitor");
    unsubscribeDocuments();
    unsubscribeWorkspaces();
  };
}
