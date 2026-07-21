// Memory Core plugin entrypoint registers its GrokBot integration.
export { MemoryIndexManager } from "./manager.js";
export {
  closeAllMemorySearchManagers,
  closeMemorySearchManager,
  getMemorySearchManager,
} from "./search-manager.js";
