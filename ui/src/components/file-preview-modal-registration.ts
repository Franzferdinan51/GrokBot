import { OpenClawFilePreviewModal } from "./file-preview-modal.ts";

if (!customElements.get("grokbot-file-preview-modal")) {
  customElements.define("grokbot-file-preview-modal", OpenClawFilePreviewModal);
}
