// Exposes fs-safe file stores after applying GrokBot filesystem defaults.
import "./fs-safe-defaults.js";

// Safe file-store facade. Callers get the repo default fs-safe configuration
// before constructing root-scoped stores.
export { fileStore } from "@grokbot/fs-safe/store";
