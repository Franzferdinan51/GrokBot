import { BrowserView, BrowserWindow } from "electron"

export type BrowserAgentState = { url: string; title: string; canGoBack: boolean; canGoForward: boolean; loading: boolean }
export type BrowserAgentBounds = { x: number; y: number; width: number; height: number }
export type BrowserAgentAction =
  | { type: "navigate"; url: string }
  | { type: "click"; selector: string }
  | { type: "type"; selector: string; text: string; submit?: boolean }
  | { type: "scroll"; amount?: number }
  | { type: "back" | "forward" | "reload" }

const DEFAULT_URL = "https://www.google.com"

function safeUrl(value: string): string {
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  const parsed = new URL(candidate)
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only HTTP(S) pages can be opened")
  return parsed.toString()
}

export class BrowserAgentController {
  private view: BrowserView | undefined
  private visible = false
  private state: BrowserAgentState = { url: DEFAULT_URL, title: "Browser Agent", canGoBack: false, canGoForward: false, loading: false }

  constructor(private readonly getWindow: () => BrowserWindow | null) {}

  private emit(): void {
    const win = this.getWindow()
    if (win && !win.isDestroyed()) win.webContents.send("browser-agent:state", this.state)
  }

  private async updateState(): Promise<BrowserAgentState> {
    if (!this.view) return this.state
    const contents = this.view.webContents
    this.state = { url: contents.getURL() || this.state.url, title: contents.getTitle() || "Browser Agent", canGoBack: contents.canGoBack(), canGoForward: contents.canGoForward(), loading: contents.isLoading() }
    this.emit()
    return this.state
  }

  private ensure(): BrowserView {
    if (this.view && !this.view.webContents.isDestroyed()) return this.view
    const view = new BrowserView({ webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, partition: "persist:grok-build-browser-agent" } })
    view.setBackgroundColor("#111318")
    view.webContents.setWindowOpenHandler(({ url }) => { void this.navigate(url); return { action: "deny" } })
    view.webContents.on("did-start-loading", () => { void this.updateState() })
    view.webContents.on("did-stop-loading", () => { void this.updateState() })
    view.webContents.on("did-navigate", () => { void this.updateState() })
    view.webContents.on("did-navigate-in-page", () => { void this.updateState() })
    view.webContents.on("page-title-updated", () => { void this.updateState() })
    view.webContents.on("will-navigate", (event, url) => { try { safeUrl(url) } catch { event.preventDefault() } })
    this.view = view
    return view
  }

  async show(bounds?: BrowserAgentBounds): Promise<BrowserAgentState> {
    const win = this.getWindow()
    if (!win) throw new Error("Main window is unavailable")
    const view = this.ensure()
    if (!win.getBrowserViews().includes(view)) win.addBrowserView(view)
    this.visible = true
    if (bounds) view.setBounds(bounds)
    if (!view.webContents.getURL()) await view.webContents.loadURL(DEFAULT_URL)
    return this.updateState()
  }

  hide(): void {
    const win = this.getWindow()
    if (this.view && win?.getBrowserViews().includes(this.view)) win.removeBrowserView(this.view)
    this.visible = false
  }

  async setBounds(bounds: BrowserAgentBounds): Promise<void> {
    if (!this.visible) return
    const view = this.ensure()
    view.setBounds({ x: Math.max(0, Math.round(bounds.x)), y: Math.max(0, Math.round(bounds.y)), width: Math.max(1, Math.round(bounds.width)), height: Math.max(1, Math.round(bounds.height)) })
  }

  async navigate(url: string): Promise<BrowserAgentState> { await this.ensure().webContents.loadURL(safeUrl(url)); return this.updateState() }
  async back(): Promise<BrowserAgentState> { const wc = this.ensure().webContents; if (wc.canGoBack()) wc.goBack(); return this.updateState() }
  async forward(): Promise<BrowserAgentState> { const wc = this.ensure().webContents; if (wc.canGoForward()) wc.goForward(); return this.updateState() }
  async reload(): Promise<BrowserAgentState> { this.ensure().webContents.reload(); return this.updateState() }
  status(): BrowserAgentState { return this.state }

  async inspect(): Promise<{ url: string; title: string; text: string; controls: { selector: string; label: string; tag: string; type: string | null }[] }> {
    const wc = this.ensure().webContents
    const snapshot = await wc.executeJavaScript(`(() => ({ url: location.href, title: document.title, text: (document.body?.innerText || '').slice(0, 24000), controls: Array.from(document.querySelectorAll('a,button,input,textarea,select,[role=button]')).slice(0, 100).map((el, i) => { const id = el.id ? '#' + CSS.escape(el.id) : ''; const name = el.getAttribute('name'); const selector = id || (name ? el.tagName.toLowerCase() + '[name="' + CSS.escape(name) + '"]' : el.tagName.toLowerCase() + ':nth-of-type(' + (Array.from(el.parentElement?.children || []).filter(x => x.tagName === el.tagName).indexOf(el) + 1) + ')'); return { selector, label: (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.textContent || '').trim().slice(0, 160), tag: el.tagName.toLowerCase(), type: el.getAttribute('type') }; }) }))()`) as Awaited<ReturnType<BrowserAgentController["inspect"]>>
    await this.updateState()
    return snapshot
  }

  async act(action: BrowserAgentAction): Promise<BrowserAgentState> {
    if (action.type === "navigate") return this.navigate(action.url)
    if (action.type === "back") return this.back()
    if (action.type === "forward") return this.forward()
    if (action.type === "reload") return this.reload()
    const wc = this.ensure().webContents
    if (action.type === "scroll") await wc.executeJavaScript(`window.scrollBy({ top: ${Math.max(-5000, Math.min(5000, Number(action.amount) || 700))}, behavior: 'smooth' })`)
    if (action.type === "click") await wc.executeJavaScript(`(() => { const el = document.querySelector(${JSON.stringify(action.selector.slice(0, 500))}); if (!el) throw new Error('Element not found: ' + ${JSON.stringify(action.selector.slice(0, 120))}); (el).scrollIntoView({block:'center'}); (el).click() })()`)
    if (action.type === "type") await wc.executeJavaScript(`(() => { const el = document.querySelector(${JSON.stringify(action.selector.slice(0, 500))}); if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) throw new Error('Writable field not found'); el.focus(); if ('value' in el) { const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set; setter?.call(el, ${JSON.stringify(action.text.slice(0, 12000))}); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); } ${action.submit ? "el.form?.requestSubmit?.()" : ""} })()`)
    return this.updateState()
  }
}
