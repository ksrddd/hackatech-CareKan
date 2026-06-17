// Re-export shim — single source of truth is `/shared/types.ts` at the repo root.
// Backend will import the same module so wire shapes stay in sync.
// (Relative path keeps it bundler-agnostic — no alias config required for FE+BE.)
export * from '../../../shared/types';
