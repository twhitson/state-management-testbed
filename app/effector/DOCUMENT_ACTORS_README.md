# Effector Document Actors - Factories Pattern

This implementation demonstrates using `@withease/factories` to create isolated document actors for each document in the Effector example. Each actor manages all document-specific behaviors including persistence, validation, and any other document-level operations.

## Overview

Each document automatically gets its own **Document Actor** when it's created. The actor is an isolated instance that manages:

### Current Behaviors:
1. **Network Persistence (SessionStorage)** - 3 second delay
2. **Disk Persistence (LocalStorage)** - 5 second delay

### Future Behaviors (Easy to Add):
- Auto-save debouncing
- Conflict detection and resolution
- Document validation
- Change tracking for undo/redo
- Real-time collaboration sync
- Document-specific analytics
- Version snapshots
- Background processing

## Why Document Actors?

The **Actor Pattern** provides:

- **Isolation** - Each document has its own state and behaviors
- **Scalability** - Can handle thousands of documents without global state conflicts
- **Encapsulation** - All document logic is contained within the actor
- **Extensibility** - Easy to add new behaviors without modifying global state
- **Type Safety** - Full TypeScript inference throughout

## Files

- `document.factory.ts` - The document actor factory implementation
- `routes/effector.tsx` - Updated to import and initialize the actors

## How It Works

### 1. Factory Creation

```typescript
const createDocumentActor = createFactory((documentId: string) => {
  // Creates isolated state, effects, and behaviors for this specific document
  // Returns the actor's public API
});
```

### 2. Factory Invocation

```typescript
const actor = invoke(createDocumentActor, documentId);
```

Each invocation creates a completely isolated actor instance with its own:
- Events (`documentChanged`)
- Effects (`persistToSessionStorageFx`, `persistToLocalStorageFx`)
- Watchers
- State (if needed)
- Any document-specific logic

### 3. Automatic Initialization

The factory watches the `$documents` store and automatically initializes an actor for any new documents:

```typescript
$documents.watch((documents) => {
  Object.keys(documents).forEach((documentId) => {
    initializeDocumentActor(documentId);
  });
});
```

### 4. Actor Triggers

Each actor watches the global `$documents` store for changes to its specific document:

```typescript
$documents.watch((documents) => {
  const document = documents[documentId];
  if (document) {
    documentChanged(document); // Triggers all actor behaviors
  }
});
```

### 5. Parallel Behavior Execution

All behaviors run in parallel using `sample()`:

```typescript
// Network persistence (3s)
sample({
  clock: documentChanged,
  target: persistToSessionStorageFx,
});

// Disk persistence (5s)
sample({
  clock: documentChanged,
  target: persistToLocalStorageFx,
});

// Future behaviors would be added here similarly
```

## Benefits of the Actor Pattern

1. **Isolation** - Each document has its own actor instance with isolated state
2. **Type Safety** - Full TypeScript inference throughout
3. **SSR Ready** - Properly handles server-side rendering with the factories plugin
4. **Testability** - Easy to test each actor instance independently
5. **Memory Management** - Could easily add cleanup logic when documents are removed
6. **Scalability** - No global state conflicts, can handle thousands of documents
7. **Maintainability** - All document logic in one place
8. **Extensibility** - Add new behaviors without modifying global state

## Observing the Actors

Open the browser console when using the Effector example page:

1. **Create a document** - you'll see:
   ```
   [Document] Creating actor for document doc-xxx
   [Document] Initializing actor for doc-xxx
   [Document] [doc-xxx] Starting network persist (New Document)...
   [Document] [doc-xxx] Starting disk persist (New Document)...
   ```

2. **After 3 seconds:**
   ```
   [Document] [doc-xxx] ✓ Network persist complete (New Document)
   ```

3. **After 5 seconds:**
   ```
   [Document] [doc-xxx] ✓ Disk persist complete (New Document)
   ```

4. **Load workspaces** - each document from the workspace will get its own actor:
   ```
   [Document] Creating actor for document doc-workspace-1-1
   [Document] Creating actor for document doc-workspace-1-2
   [Document] Creating actor for document doc-workspace-2-1
   ...
   ```

5. **Add a document to a workspace** - triggers all behaviors for that document again

## Storage Inspection

You can inspect the persisted data in DevTools:

- **Application → Session Storage** - See network-persisted documents
- **Application → Local Storage** - See disk-persisted documents

Keys follow the pattern: `document:{documentId}`

## Adding New Behaviors

To add a new behavior to document actors, simply add it to the factory:

```typescript
const createDocumentActor = createFactory((documentId: string) => {
  // ... existing code ...

  // NEW BEHAVIOR: Auto-save with debouncing
  const debouncedSaveFx = createEffect<Document, void>(
    async (document: Document) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Save logic here
    }
  );

  sample({
    clock: documentChanged,
    target: debouncedSaveFx,
  });

  // NEW BEHAVIOR: Conflict detection
  const detectConflictsFx = createEffect<Document, void>(
    async (document: Document) => {
      // Conflict detection logic here
    }
  );

  sample({
    clock: documentChanged,
    target: detectConflictsFx,
  });

  // ... return updated API ...
  return {
    documentId,
    documentChanged,
    persistToSessionStorageFx,
    persistToLocalStorageFx,
    debouncedSaveFx,
    detectConflictsFx,
  };
});
```

## Public API

### `initializeDocumentActor(documentId: string)`

Creates and initializes a document actor for the given document ID.

```typescript
const actor = initializeDocumentActor('doc-123');
```

### `getDocumentActor(documentId: string)`

Retrieves an existing document actor instance.

```typescript
const actor = getDocumentActor('doc-123');
if (actor) {
  // Do something with the actor
}
```

## Actor Lifecycle

1. **Creation** - Actor is created when document is first added to store
2. **Active** - Actor watches for changes and runs behaviors
3. **Future: Cleanup** - Could add logic to dispose actor when document is deleted

## Why Two Separate Persistence Loops?

This architecture mimics real-world systems where:
- **Network persistence** (sessionStorage) represents saving to a remote server
- **Disk persistence** (localStorage) represents writing to local disk/cache

They have different latencies and can fail independently, just like in production systems.

## Comparison with Other Patterns

### vs. Global Effects
- ✅ Isolated state per document
- ✅ No document ID tracking needed
- ✅ Easier to test

### vs. Middleware
- ✅ Type-safe
- ✅ More explicit
- ✅ Better composition

### vs. Manual Management
- ✅ Automatic lifecycle
- ✅ No memory leaks
- ✅ SSR compatible

## Real-World Use Cases

This pattern is ideal for:

1. **Document Editors** - Each document has its own sync, validation, history
2. **Chat Applications** - Each conversation has its own actor
3. **Game Entities** - Each player/NPC has its own behavior actor
4. **IoT Dashboards** - Each device has its own data actor
5. **Multi-tenant Systems** - Each tenant has isolated state management
6. **Collaborative Tools** - Each resource has its own conflict resolution

## Future Enhancements

Potential additions to demonstrate more advanced patterns:

- ✨ Retry logic for failed persistence
- ✨ Debouncing to avoid excessive writes on rapid changes
- ✨ Conflict resolution between network and disk
- ✨ Cleanup when documents are deleted
- ✨ Persistence queue to handle offline scenarios
- ✨ Actor-to-actor communication
- ✨ Shared actor behaviors/mixins
- ✨ Actor lifecycle hooks (onInit, onDestroy)
- ✨ Actor health monitoring

