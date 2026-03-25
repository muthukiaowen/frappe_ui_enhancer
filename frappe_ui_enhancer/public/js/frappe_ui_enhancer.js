/**
 * Frappe UI Enhancer v0.1.0
 * Author: muthukiaowen@cyvetech.com | Cyvetech
 *
 * Three systems:
 * 1. FrappeUIEnhancer     — fetches merged config, applies CSS variables, logo, backgrounds, fonts, footer
 * 2. FrappeNotifications  — toast popups, bell icon, sidebar panel, read/unread tracking
 * 3. EnhancerGradientBuilder — gradient picker (window global for form use)
 */

(function() {
"use strict";

// =============================================================================
// 1. UI ENHANCER — applies full theme from config
// =============================================================================

class FrappeUIEnhancer {
    constructor() {
        this.cacheKey = "frappe_ui_enhancer_v6";
        this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days
        this.cfg      = null;
        this._fontLoaded = false;
        this._init();
    }

    async _init() {
        try {
            const cached = this._getCache();
            if (cached) { this.cfg = cached; this._applyAll(); }
            await this._load();
            if (this.cfg) this._applyAll();
        } catch(e) { /* never break ERPNext */ }
    }

    async _load() {
        try {
            const res  = await fetch("/api/method/frappe_ui_enhancer.api.get_ui_settings",
                                     { headers: { Accept: "application/json" } });
            const json = await res.json();
            const data = json && json.message ? json.message : null;
            if (!data || !Object.keys(data).length) return;
            this.cfg = data;
            this._setCache(data);
        } catch(e) {}
    }

    _applyAll() {
        const c = this.cfg;
        if (!c) return;
        this._applyCSSVars(c);
        this._applyFont(c);
        this._applyLogo(c);
        this._applyLoginPage(c);
        this._applyWorkspaceBg(c);
        this._applyFooter(c);
        this._applyUserCSS(c);
    }

    // ── CSS Variables ─────────────────────────────────────────────────────────
    // Sets every CSS variable — the CSS file reads these with var()
    _applyCSSVars(c) {
        const r = document.documentElement;
        const set = (k, v) => { if (v) r.style.setProperty(k, v); };

        // Theme
        set("--ui-primary",         c.primary_color);
        set("--ui-secondary",       c.secondary_color);
        set("--ui-accent",          c.accent_color);
        set("--ui-text",            c.text_color);
        set("--ui-link",            c.link_color);
        set("--ui-success",         c.success_color);
        set("--ui-warning",         c.warning_color);
        set("--ui-danger",          c.danger_color);

        // Typography
        set("--ui-font",            c.font_family ? `"${c.font_family}", sans-serif` : null);
        set("--ui-font-size",       c.font_size_base);
        set("--ui-font-weight",     c.font_weight_normal);
        set("--ui-font-bold",       c.font_weight_bold);
        set("--ui-radius",          c.border_radius);

        // Navbar
        set("--ui-navbar-bg",       c.navbar_bg);
        set("--ui-navbar-text",     c.navbar_text);
        set("--ui-navbar-h",        c.navbar_height);

        // Sidebar
        set("--ui-sidebar-bg",      c.sidebar_bg);
        set("--ui-sidebar-text",    c.sidebar_text);
        set("--ui-sidebar-act-bg",  c.sidebar_active_bg);
        set("--ui-sidebar-act-txt", c.sidebar_active_text);

        // Page & cards
        set("--ui-page-bg",         c.page_bg);
        set("--ui-card-bg",         c.card_bg);
        set("--ui-card-border",     c.card_border);

        // Buttons
        set("--ui-btn-bg",          c.btn_primary_bg);
        set("--ui-btn-text",        c.btn_primary_text);
        set("--ui-btn-hover",       c.btn_primary_hover);
        set("--ui-btn2-bg",         c.btn_secondary_bg);
        set("--ui-btn2-text",       c.btn_secondary_text);

        // Inputs
        set("--ui-input-bg",        c.input_bg);
        set("--ui-input-border",    c.input_border);
        set("--ui-input-text",      c.input_text);
        set("--ui-input-focus",     c.input_focus_border);
        set("--ui-label",           c.label_color);

        // Tables
        set("--ui-th-bg",           c.table_head_bg);
        set("--ui-th-text",         c.table_head_text);
        set("--ui-tr-bg",           c.table_row_bg);
        set("--ui-tr-alt",          c.table_row_alt_bg);
        set("--ui-tr-text",         c.table_row_text);
        set("--ui-table-border",    c.table_border);

        // Footer
        set("--ui-footer-bg",       c.footer_bg);
        set("--ui-footer-text",     c.footer_text);

        // Login
        set("--ui-login-box-bg",    c.login_box_bg);
        set("--ui-login-btn-bg",    c.login_btn_bg);
        set("--ui-login-btn-text",  c.login_btn_text);
        set("--ui-login-radius",    c.login_box_radius);
    }

    // ── Font Loading ──────────────────────────────────────────────────────────
    _applyFont(c) {
        if (!c.font_family || this._fontLoaded) return;
        const link = document.createElement("link");
        link.rel  = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(c.font_family)}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
        this._fontLoaded = true;
    }

    // ── Logo ─────────────────────────────────────────────────────────────────
    _applyLogo(c) {
        if (!c.company_logo) return;
        const w = (c.logo_width || 120) + "px";
        this._waitFor(".navbar-brand img,.navbar-brand .app-logo,.desk-sidebar-logo img", el => {
            el.src = c.company_logo;
            el.style.cssText = `width:${w};height:auto;object-fit:contain`;
        }, true);
    }

    // ── Login Page ────────────────────────────────────────────────────────────
    _applyLoginPage(c) {
        const isLogin = document.body.classList.contains("login-page") ||
                        !!document.querySelector("#page-login,.for-login");
        if (!isLogin) return;

        // Background
        const bg = document.querySelector("#page-login") || document.body;
        this._applyBg(bg, c, "login");

        // Login box positioning
        if (c.login_box_position && c.login_box_position !== "center") {
            this._waitFor(".for-login,.for-signup,.for-forgot", el => {
                el.style.position = "absolute";
                el.style.top = "15%";
                if (c.login_box_position === "left")  { el.style.left = "8%"; el.style.right = "auto"; }
                if (c.login_box_position === "right")  { el.style.right = "8%"; el.style.left = "auto"; }
            }, true);
        }

        // Login page title and subtitle
        if (c.login_title) {
            this._waitFor(".for-login .page-card-head h4", el => {
                el.textContent = c.login_title;
            });
        }
        if (c.login_subtitle) {
            this._waitFor(".for-login .page-card-head", el => {
                if (!el.querySelector(".enh-subtitle")) {
                    const sub = document.createElement("p");
                    sub.className = "enh-subtitle";
                    sub.textContent = c.login_subtitle;
                    sub.style.cssText = "font-size:13px;color:#888;margin:4px 0 0";
                    el.appendChild(sub);
                }
            });
        }

        // Company tagline below logo
        if (c.company_tagline) {
            this._waitFor(".navbar-brand", el => {
                if (!el.querySelector(".enh-tagline")) {
                    const tag = document.createElement("div");
                    tag.className = "enh-tagline";
                    tag.textContent = c.company_tagline;
                    tag.style.cssText = "font-size:10px;color:#aaa;margin-top:2px;letter-spacing:0.5px";
                    el.appendChild(tag);
                }
            });
        }
    }

    // ── Workspace Background ──────────────────────────────────────────────────
    _applyWorkspaceBg(c) {
        if (!c.workspace_bg_type || c.workspace_bg_type === "None") return;
        this._waitFor(".layout-main-section-wrapper,.main-section", el => {
            this._applyBg(el, c, "workspace");
        });
    }

    // ── Background Helper ─────────────────────────────────────────────────────
    _applyBg(el, c, prefix) {
        const type = c[`${prefix}_bg_type`];
        if (!type || type === "None") return;
        el.style.transition = "background 0.3s ease";
        if (type === "Solid Color") {
            el.style.background = c[`${prefix}_bg_color`] || "#fff";
        } else if (type === "Gradient") {
            el.style.background = c[`${prefix}_bg_gradient`] ||
                "linear-gradient(135deg,#667eea,#764ba2)";
        } else if (type === "Image" && c[`${prefix}_bg_image`]) {
            el.style.backgroundImage    = `url('${c[prefix + "_bg_image"]}')`;
            el.style.backgroundSize     = "cover";
            el.style.backgroundPosition = "center";
            el.style.backgroundRepeat   = "no-repeat";
            const blur = parseInt(c[`${prefix}_bg_blur`] || 0);
            if (blur > 0) el.style.filter = `blur(${blur}px)`;
        }
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    _applyFooter(c) {
        if (!c.show_footer || !c.footer_content) return;
        const isLogin = document.body.classList.contains("login-page") ||
                        !!document.querySelector("#page-login");
        if (isLogin) return;

        this._waitFor(".main-section,.layout-main", mainEl => {
            if (document.getElementById("enh-footer")) return;
            const footer = document.createElement("div");
            footer.id = "enh-footer";
            footer.innerHTML = c.footer_content;
            footer.style.cssText = `
                background:var(--ui-footer-bg,#f8f8f8);
                color:var(--ui-footer-text,#666);
                padding:12px 20px;font-size:12px;
                border-top:1px solid var(--ui-card-border,#eee);
                text-align:center;`;
            mainEl.appendChild(footer);
        });
    }

    // ── User Custom CSS ───────────────────────────────────────────────────────
    _applyUserCSS(c) {
        // Global custom CSS
        if (c.custom_css) this._injectCSS("enh-global-css", c.custom_css);
        // User-scoped CSS (authenticated users only)
        if (c.user_custom_css && c.allow_user_custom_css) {
            this._injectCSS("enh-user-css", c.user_custom_css);
        }
    }

    _injectCSS(id, css) {
        let el = document.getElementById(id);
        if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
        el.textContent = css;
    }

    // ── Cache ─────────────────────────────────────────────────────────────────
    _getCache() {
        try {
            const r = localStorage.getItem(this.cacheKey);
            if (!r) return null;
            const o = JSON.parse(r);
            return (Date.now() - o.ts < this.cacheTTL) ? o.data : null;
        } catch(e) { return null; }
    }
    _setCache(d) {
        try { localStorage.setItem(this.cacheKey, JSON.stringify({ts:Date.now(), data:d})); }
        catch(e) {}
    }

    _waitFor(sel, cb, all, n) {
        n = n || 0;
        let found = false;
        sel.split(",").map(s => s.trim()).forEach(s => {
            if (all) { document.querySelectorAll(s).forEach(el => { cb(el); found=true; }); }
            else { const el = document.querySelector(s); if (el) { cb(el); found=true; } }
        });
        if (!found && n < 30) setTimeout(() => this._waitFor(sel,cb,all,n+1), 200);
    }
}


// =============================================================================
// 2. NOTIFICATION SYSTEM
// =============================================================================

class FrappeNotifications {
    constructor() {
        this.toasts    = {};
        this.panelOpen = false;
        this.page      = 1;
        this.totalPages= 1;
        this.filter    = "all";
        this.cfg       = null;

        if (!window.frappe || !frappe.session || frappe.session.user === "Guest") return;

        this._injectStyles();
        this._buildPanel();
        this._insertBell();
        this._loadCfg();
        this._loadUnread();
        this._refreshBadge();
        this._listenRealtime();
    }

    _loadCfg() {
        try {
            const raw = localStorage.getItem("frappe_ui_enhancer_v6");
            if (raw) this.cfg = JSON.parse(raw).data || null;
        } catch(e) {}
    }

    _listenRealtime() {
        if (!frappe.realtime) return;
        frappe.realtime.on("ui_enhancer_notification", data => {
            this._showToast(data);
            this._refreshBadge();
            if (this.panelOpen) this._loadPanel(this.page);
        });
    }

    _loadUnread() {
        frappe.call({
            method: "frappe_ui_enhancer.utils.notification_handler.get_notifications",
            args: { page:1, page_size:20, filter_unread:true },
            callback: r => {
                if (!r.message) return;
                r.message.notifications.forEach(n => {
                    if (!this.toasts[n.name])
                        this._showToast({log_name:n.name,title:n.title,message:n.message,
                            priority:n.priority,link_doctype:n.link_doctype,link_name:n.link_name});
                });
            }
        });
    }

    // ── Toast ─────────────────────────────────────────────────────────────────
    _showToast(data) {
        if (!data || !data.log_name || this.toasts[data.log_name]) return;

        // Check mute hours
        if (this._isMuted()) return;

        const c = this.cfg;
        const colors = {
            Info:     { bg: (c && c.toast_info_bg)      || "#EAF4FE", accent: (c && c.toast_info_color)      || "#2490EF", ttl: (c && c.toast_duration_info)    || 8000  },
            Warning:  { bg: (c && c.toast_warning_bg)   || "#FFF8EC", accent: (c && c.toast_warning_color)   || "#F5A623", ttl: (c && c.toast_duration_warning) || 12000 },
            Critical: { bg: (c && c.toast_critical_bg)  || "#FEECEC", accent: (c && c.toast_critical_color)  || "#E53935", ttl: 0 }
        }[data.priority] || { bg:"#EAF4FE", accent:"#2490EF", ttl:8000 };

        const hasLink = data.link_doctype && data.link_name;
        const toast   = document.createElement("div");
        toast.className = "enh-toast";
        toast.innerHTML = `
            <div class="enh-t-inner" style="border-left:4px solid ${colors.accent};background:${colors.bg}">
                <div class="enh-t-head">
                    <span class="enh-t-badge" style="background:${colors.accent}">${data.priority||"Info"}</span>
                    <strong class="enh-t-title">${this._e(data.title)}</strong>
                    <button class="enh-t-x">&#x2715;</button>
                </div>
                <p class="enh-t-msg">${this._e(data.message||"")}</p>
                ${hasLink ? `<a class="enh-t-link" href="/app/${this._slug(data.link_doctype)}/${encodeURIComponent(data.link_name)}">
                    Open ${this._e(data.link_doctype)} &#8594;</a>` : ""}
            </div>`;

        toast.querySelector(".enh-t-x").onclick = e => {
            e.stopPropagation();
            this._markRead(data.log_name);
            this._removeToast(toast, data.log_name);
        };
        const lnk = toast.querySelector(".enh-t-link");
        if (lnk) lnk.onclick = () => { this._markRead(data.log_name); this._removeToast(toast, data.log_name); };

        this._toastWrap().appendChild(toast);
        this.toasts[data.log_name] = toast;

        // Play sound
        this._playSound(data.priority);

        // Auto-dismiss (not for Critical)
        if (colors.ttl > 0) {
            setTimeout(() => { delete this.toasts[data.log_name]; this._removeToast(toast, null); }, colors.ttl);
        }
    }

    _isMuted() {
        if (!this.cfg || !this.cfg.notif_mute_from || !this.cfg.notif_mute_to) return false;
        try {
            const now  = new Date();
            const [fh, fm] = this.cfg.notif_mute_from.split(":").map(Number);
            const [th, tm] = this.cfg.notif_mute_to.split(":").map(Number);
            const cur  = now.getHours() * 60 + now.getMinutes();
            const from = fh * 60 + fm;
            const to   = th * 60 + tm;
            return (from <= to) ? (cur >= from && cur <= to) : (cur >= from || cur <= to);
        } catch(e) { return false; }
    }

    _playSound(priority) {
        const sound = this.cfg && this.cfg.notif_sound;
        if (!sound || sound === "Off") return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain= ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            const freq = { Info:440, Warning:550, Critical:660 }[priority] || 440;
            osc.frequency.value = freq;
            osc.type = sound === "Chime" ? "sine" : sound === "Alert" ? "square" : "triangle";
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }

    _removeToast(el, logName) {
        if (logName) delete this.toasts[logName];
        if (!el) return;
        el.style.opacity   = "0";
        el.style.transform = "translateX(110%)";
        setTimeout(() => el && el.remove(), 350);
    }

    _toastWrap() {
        let c = document.getElementById("enh-toasts");
        if (!c) {
            c = document.createElement("div");
            c.id = "enh-toasts";
            // Position based on config
            const pos = (this.cfg && this.cfg.toast_position) || "top-right";
            const styles = {
                "top-right":     "top:64px;right:18px",
                "top-center":    "top:64px;left:50%;transform:translateX(-50%)",
                "top-left":      "top:64px;left:18px",
                "bottom-right":  "bottom:20px;right:18px",
                "bottom-center": "bottom:20px;left:50%;transform:translateX(-50%)",
            };
            c.style.cssText = `position:fixed;${styles[pos]||styles["top-right"]};z-index:9999;
                display:flex;flex-direction:column;gap:8px;max-width:360px;pointer-events:none`;
            document.body.appendChild(c);
        }
        return c;
    }

    // ── Bell Icon ─────────────────────────────────────────────────────────────
    _insertBell() {
        let tries = 0;
        const iv = setInterval(() => {
            tries++;
            const nav = document.querySelector(".navbar-right,.navbar-nav.ml-auto,.navbar-nav");
            if (nav || tries > 50) {
                clearInterval(iv);
                if (!nav || document.getElementById("enh-bell")) return;
                const li = document.createElement("li");
                li.id = "enh-bell"; li.className = "nav-item";
                li.innerHTML = `
                    <a href="#" class="nav-link enh-bell-a" title="Notifications"
                       style="position:relative;display:flex;align-items:center;padding:0 9px">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span id="enh-badge" style="display:none;position:absolute;top:3px;right:1px;
                            background:#E53935;color:#fff;border-radius:10px;font-size:9px;
                            font-weight:700;line-height:14px;padding:0 4px;min-width:14px;text-align:center">0</span>
                    </a>`;
                nav.appendChild(li);
                li.querySelector(".enh-bell-a").onclick = e => {
                    e.preventDefault();
                    this.panelOpen ? this._closePanel() : this._openPanel();
                };
            }
        }, 300);
    }

    // ── Panel ─────────────────────────────────────────────────────────────────
    _buildPanel() {
        const p = document.createElement("div");
        p.id = "enh-panel";
        p.innerHTML = `
            <div class="enh-p-hdr">
                <span id="enh-p-title">Notifications</span>
                <div style="display:flex;align-items:center;gap:8px">
                    <button id="enh-mark-all">Mark all read</button>
                    <button id="enh-p-x">&#x2715;</button>
                </div>
            </div>
            <div class="enh-p-filters">
                <button class="enh-f active" data-f="all">All</button>
                <button class="enh-f" data-f="unread">Unread</button>
            </div>
            <div id="enh-list"></div>
            <div class="enh-p-pager">
                <button id="enh-prev" disabled>&#8592; Prev</button>
                <span id="enh-pg-info">Page 1 of 1</span>
                <button id="enh-next" disabled>Next &#8594;</button>
            </div>
            <div class="enh-p-foot">
                <a href="/app/notification-log">View all notifications &#8594;</a>
                <a href="/app/user-ui-preferences" style="margin-left:16px">My preferences &#8594;</a>
            </div>`;
        document.body.appendChild(p);

        const bd = document.createElement("div");
        bd.id = "enh-bd"; document.body.appendChild(bd);

        p.querySelector("#enh-p-x").onclick   = () => this._closePanel();
        bd.onclick                              = () => this._closePanel();
        p.querySelector("#enh-mark-all").onclick= () => this._markAllRead();
        p.querySelector("#enh-prev").onclick    = () => { if (this.page>1) this._loadPanel(this.page-1); };
        p.querySelector("#enh-next").onclick    = () => { if (this.page<this.totalPages) this._loadPanel(this.page+1); };
        p.querySelectorAll(".enh-f").forEach(btn =>
            btn.onclick = () => {
                p.querySelectorAll(".enh-f").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.filter = btn.dataset.f;
                this._loadPanel(1);
            }
        );
    }

    _openPanel()  { this.panelOpen=true;  document.getElementById("enh-panel").classList.add("open");  document.getElementById("enh-bd").classList.add("show"); this._loadPanel(1); }
    _closePanel() { this.panelOpen=false; document.getElementById("enh-panel").classList.remove("open"); document.getElementById("enh-bd").classList.remove("show"); }

    _loadPanel(page) {
        this.page = page;
        document.getElementById("enh-list").innerHTML =
            '<div style="padding:30px;text-align:center;font-size:13px;color:#999">Loading&#8230;</div>';
        frappe.call({
            method: "frappe_ui_enhancer.utils.notification_handler.get_notifications",
            args: { page, page_size:10, filter_unread: this.filter==="unread" },
            callback: r => {
                if (!r.message) return;
                const d = r.message;
                this.totalPages = d.total_pages;
                this._renderList(d.notifications);
                document.getElementById("enh-pg-info").textContent = `Page ${d.page} of ${d.total_pages} (${d.total} total)`;
                document.getElementById("enh-prev").disabled = d.page<=1;
                document.getElementById("enh-next").disabled = d.page>=d.total_pages;
                this._updateBadge(d.unread_count);
            }
        });
    }

    _renderList(items) {
        const list = document.getElementById("enh-list");
        if (!items || !items.length) {
            list.innerHTML = '<div style="padding:30px;text-align:center;font-size:13px;color:#999">No notifications.</div>';
            return;
        }
        const dot = {Info:"#2490EF", Warning:"#F5A623", Critical:"#E53935"};
        list.innerHTML = items.map(n => `
            <div class="enh-item${n.is_read?"":" unread"}"
                 data-log="${this._e(n.name)}" data-dt="${this._e(n.link_doctype||"")}" data-dn="${this._e(n.link_name||"")}">
                <span class="enh-dot" style="background:${dot[n.priority]||"#2490EF"}"></span>
                <div class="enh-ic">
                    <div class="enh-it">${this._e(n.title)}</div>
                    <div class="enh-im">${this._e(n.message||"")}</div>
                    <div class="enh-imeta">
                        <span class="enh-time">${this._ago(n.delivered_at)}</span>
                        ${n.link_doctype&&n.link_name?`<a class="enh-il" href="/app/${this._slug(n.link_doctype)}/${encodeURIComponent(n.link_name)}">${this._e(n.link_doctype)}: ${this._e(n.link_name)} &#8594;</a>`:""}
                    </div>
                </div>
                ${!n.is_read?`<button class="enh-ck" data-log="${this._e(n.name)}" title="Mark read">&#10003;</button>`:`<span class="enh-done">&#10003;</span>`}
            </div>`).join("");

        list.querySelectorAll(".enh-item").forEach(item =>
            item.onclick = e => {
                if (e.target.classList.contains("enh-ck")||e.target.classList.contains("enh-il")) return;
                this._markRead(item.dataset.log, () => { item.classList.remove("unread"); item.querySelector(".enh-ck")?.remove(); });
                if (item.dataset.dt && item.dataset.dn) { frappe.set_route(item.dataset.dt, item.dataset.dn); this._closePanel(); }
            }
        );
        list.querySelectorAll(".enh-ck").forEach(btn =>
            btn.onclick = e => {
                e.stopPropagation();
                this._markRead(btn.dataset.log, () => { const i=btn.closest(".enh-item"); if(i) i.classList.remove("unread"); btn.remove(); });
            }
        );
        list.querySelectorAll(".enh-il").forEach(lnk =>
            lnk.onclick = () => { const i=lnk.closest(".enh-item"); if(i) this._markRead(i.dataset.log); this._closePanel(); }
        );
    }

    // ── Read / Badge ──────────────────────────────────────────────────────────
    _markRead(logName, cb) {
        frappe.call({
            method: "frappe_ui_enhancer.utils.notification_handler.mark_as_read",
            args: { log_name:logName },
            callback: r => {
                if (r.message && r.message.status==="ok") {
                    const t = this.toasts[logName]; if (t) this._removeToast(t,logName);
                    this._refreshBadge(); if (cb) cb();
                }
            }
        });
    }
    _markAllRead() {
        frappe.call({
            method: "frappe_ui_enhancer.utils.notification_handler.mark_all_read",
            callback: () => {
                Object.entries(this.toasts).forEach(([k,t]) => this._removeToast(t,k));
                this.toasts = {};
                this._updateBadge(0);
                this._loadPanel(1);
            }
        });
    }
    _refreshBadge() {
        frappe.call({
            method: "frappe_ui_enhancer.utils.notification_handler.get_unread_count",
            callback: r => this._updateBadge(r.message||0)
        });
    }
    _updateBadge(count) {
        const b = document.getElementById("enh-badge");
        if (b) { b.textContent=count>99?"99+":count; b.style.display=count>0?"inline-block":"none"; }
        const t = document.getElementById("enh-p-title");
        if (t) t.textContent = count>0 ? `Notifications (${count} unread)` : "Notifications";
    }

    // ── Styles ────────────────────────────────────────────────────────────────
    _injectStyles() {
        if (document.getElementById("enh-css")) return;
        const s = document.createElement("style"); s.id="enh-css";
        s.textContent = `
.enh-toast{pointer-events:all;animation:enhIn .28s ease;transition:opacity .32s,transform .32s}
.enh-t-inner{background:#fff;border-radius:8px;padding:13px 15px;box-shadow:0 3px 16px rgba(0,0,0,.13)}
.enh-t-head{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.enh-t-badge{font-size:10px;font-weight:700;color:#fff;padding:2px 6px;border-radius:9px}
.enh-t-title{flex:1;font-size:13px;font-weight:600;color:#1a1a1a}
.enh-t-x{background:none;border:none;font-size:15px;cursor:pointer;color:#aaa;padding:0}
.enh-t-msg{font-size:12px;color:#555;margin:0 0 5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.enh-t-link{font-size:12px;font-weight:600;color:#2490EF;text-decoration:none}
@keyframes enhIn{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
#enh-bd{display:none;position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:9997}
#enh-bd.show{display:block}
#enh-panel{position:fixed;top:0;right:-420px;width:400px;height:100vh;background:#fff;z-index:9998;
  box-shadow:-3px 0 20px rgba(0,0,0,.11);display:flex;flex-direction:column;
  transition:right .3s cubic-bezier(.4,0,.2,1);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#enh-panel.open{right:0}
.enh-p-hdr{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid #eee;flex-shrink:0}
#enh-p-title{font-size:14px;font-weight:600;color:#1a1a1a}
#enh-mark-all{font-size:11px;color:#2490EF;background:none;border:1px solid #2490EF;border-radius:4px;padding:3px 9px;cursor:pointer}
#enh-p-x{background:none;border:none;font-size:17px;cursor:pointer;color:#aaa;padding:0}
.enh-p-filters{display:flex;gap:5px;padding:9px 16px;border-bottom:1px solid #eee;flex-shrink:0}
.enh-f{font-size:12px;padding:3px 12px;border-radius:18px;border:1px solid #ddd;background:#fff;cursor:pointer;color:#555}
.enh-f.active{background:#2490EF;color:#fff;border-color:#2490EF}
#enh-list{flex:1;overflow-y:auto}
.enh-item{display:flex;align-items:flex-start;gap:9px;padding:11px 16px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s}
.enh-item:hover{background:#f8f8f8}
.enh-item.unread{background:#F0F7FF}
.enh-item.unread:hover{background:#E3F0FF}
.enh-dot{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0}
.enh-ic{flex:1;min-width:0}
.enh-it{font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.enh-item.unread .enh-it{color:#0B5ED7}
.enh-im{font-size:11px;color:#666;margin:2px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.enh-imeta{display:flex;align-items:center;gap:8px;margin-top:3px}
.enh-time{font-size:10px;color:#bbb}
.enh-il{font-size:10px;color:#2490EF;text-decoration:none;font-weight:500}
.enh-ck{background:none;border:1px solid #ddd;color:#bbb;border-radius:50%;width:20px;height:20px;font-size:11px;cursor:pointer;flex-shrink:0;margin-top:1px;line-height:1}
.enh-done{color:#4CAF50;font-size:12px;flex-shrink:0;margin-top:2px}
.enh-p-pager{display:flex;align-items:center;justify-content:space-between;padding:9px 16px;border-top:1px solid #eee;flex-shrink:0}
#enh-prev,#enh-next{font-size:11px;padding:4px 10px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;color:#444}
#enh-prev:disabled,#enh-next:disabled{color:#ccc;cursor:not-allowed}
#enh-pg-info{font-size:11px;color:#999}
.enh-p-foot{padding:9px 16px;border-top:1px solid #eee;flex-shrink:0;display:flex;gap:4px}
.enh-p-foot a{font-size:11px;color:#2490EF;text-decoration:none}`;
        document.head.appendChild(s);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _e(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
    _slug(dt) { return (dt||"").toLowerCase().replace(/ /g,"-"); }
    _ago(dt) {
        if (!dt) return "";
        const d = Math.floor((Date.now()-new Date(dt).getTime())/1000);
        if (d<60) return "Just now";
        if (d<3600) return Math.floor(d/60)+"m ago";
        if (d<86400) return Math.floor(d/3600)+"h ago";
        return Math.floor(d/86400)+"d ago";
    }
}


// =============================================================================
// 3. GRADIENT BUILDER — window global for UI Settings form
// =============================================================================

window.EnhancerGradientBuilder = {
    render(container, initial, onChange) {
        let state = { type:"linear", angle:135, colors:["#667eea","#764ba2"] };
        if (initial) {
            const cc = initial.match(/#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)/g);
            if (cc && cc.length>=2) {
                const am = initial.match(/(\d+)deg/);
                state = { type:initial.indexOf("radial")===0?"radial":"linear", angle:am?+am[1]:135, colors:cc };
            }
        }
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid #d1d8dd;border-radius:6px;background:#f9fbff;margin-top:6px">
                <div id="egp" style="height:64px;border-radius:5px;border:1px solid #ddd"></div>
                <div style="display:flex;gap:10px;align-items:center">
                    <label style="font-size:11px;color:#888;min-width:40px">Type</label>
                    <select id="egt" style="flex:1;font-size:12px;padding:4px"><option value="linear">Linear</option><option value="radial">Radial</option></select>
                </div>
                <div id="egar" style="display:flex;gap:10px;align-items:center">
                    <label style="font-size:11px;color:#888;min-width:40px">Angle <span id="egav">${state.angle}&deg;</span></label>
                    <input type="range" id="ega" min="0" max="360" value="${state.angle}" style="flex:1">
                </div>
                <div><div style="font-size:11px;color:#888;margin-bottom:6px">Color stops</div>
                <div id="egsl" style="display:flex;flex-wrap:wrap;gap:6px"></div>
                <button type="button" id="egadd" style="margin-top:6px;font-size:11px;padding:3px 10px;border:1px dashed #2490EF;border-radius:4px;color:#2490EF;background:none;cursor:pointer">+ Add</button></div>
                <div><div style="font-size:11px;color:#888;margin-bottom:4px">Raw CSS</div>
                <input type="text" id="egr" style="width:100%;font-family:monospace;font-size:11px;padding:4px 7px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></div>
            </div>`;
        const P=container.querySelector("#egp"),T=container.querySelector("#egt"),
              A=container.querySelector("#ega"),AV=container.querySelector("#egav"),
              AR=container.querySelector("#egar"),SL=container.querySelector("#egsl"),R=container.querySelector("#egr");
        T.value=state.type;
        if (state.type==="radial") AR.style.display="none";
        const build=()=>{
            const css=state.type==="radial"?`radial-gradient(circle,${state.colors.join(",")})`:
                      `linear-gradient(${state.angle}deg,${state.colors.join(",")})`;
            P.style.background=css; R.value=css; if(onChange) onChange(css);
        };
        const renderStops=()=>{
            SL.innerHTML="";
            state.colors.forEach((c,i)=>{
                const d=document.createElement("div");
                d.style.cssText="display:flex;align-items:center;gap:5px;background:#fff;border:1px solid #e0e0e0;border-radius:4px;padding:3px 7px";
                d.innerHTML=`<input type="color" value="${c}" data-i="${i}" style="width:28px;height:24px;border:none;cursor:pointer;padding:0;border-radius:3px">
                    <span style="font-size:10px;color:#666;font-family:monospace">${c}</span>
                    ${state.colors.length>2?`<button type="button" data-i="${i}" style="background:none;border:none;color:#c00;cursor:pointer;font-size:12px;padding:0">&#x2715;</button>`:""}`;
                SL.appendChild(d);
            });
            SL.querySelectorAll("input[type=color]").forEach(inp=>inp.oninput=()=>{state.colors[+inp.dataset.i]=inp.value;inp.nextElementSibling.textContent=inp.value;build();});
            SL.querySelectorAll("button[data-i]").forEach(btn=>btn.onclick=()=>{state.colors.splice(+btn.dataset.i,1);renderStops();build();});
        };
        container.querySelector("#egadd").onclick=()=>{state.colors.push("#ffffff");renderStops();build();};
        T.onchange=()=>{state.type=T.value;AR.style.display=state.type==="radial"?"none":"";build();};
        A.oninput=()=>{state.angle=+A.value;AV.textContent=state.angle+"°";build();};
        R.onchange=()=>{
            const cc=R.value.match(/#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)/g);
            if(cc&&cc.length>=2){const am=R.value.match(/(\d+)deg/);state={type:R.value.indexOf("radial")===0?"radial":"linear",angle:am?+am[1]:135,colors:cc};T.value=state.type;A.value=state.angle;AV.textContent=state.angle+"°";renderStops();}
            build();
        };
        renderStops(); build();
    }
};


// =============================================================================
// 4. BOOT
// =============================================================================
window.frappeUIEnhancer    = new FrappeUIEnhancer();
window.frappeNotifications = new FrappeNotifications();

})();
