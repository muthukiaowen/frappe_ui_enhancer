app_name        = "frappe_ui_enhancer"
app_title       = "Frappe UI Enhancer"
app_publisher   = "Cyvetech"
app_description = "Full-stack UI customisation and interactive notifications for Frappe/ERPNext"
app_email       = "muthukiaowen@cyvetech.com"
app_license     = "MIT"
app_version     = "0.1.0"

# ── Assets served via Python API endpoints ────────────────────────────────────
# These URLs are handled by gunicorn (Python backend), NOT nginx.
# This means they work regardless of Docker volume configuration.
app_include_css = "/api/method/frappe_ui_enhancer.serve.css"
app_include_js  = "/api/method/frappe_ui_enhancer.serve.js"
web_include_css = "/api/method/frappe_ui_enhancer.serve.css"
web_include_js  = "/api/method/frappe_ui_enhancer.serve.js"

# ── Document event hooks ──────────────────────────────────────────────────────
doc_events = {
    "*": {
        "after_insert": "frappe_ui_enhancer.utils.notification_handler.handle_event",
        "on_update":    "frappe_ui_enhancer.utils.notification_handler.handle_event",
        "on_submit":    "frappe_ui_enhancer.utils.notification_handler.handle_event",
        "on_cancel":    "frappe_ui_enhancer.utils.notification_handler.handle_event",
        "on_trash":     "frappe_ui_enhancer.utils.notification_handler.handle_event",
    }
}

# ── Scheduler ─────────────────────────────────────────────────────────────────
scheduler_events = {
    "daily":  ["frappe_ui_enhancer.utils.notification_handler.run_scheduled_notifications"],
    "weekly": ["frappe_ui_enhancer.utils.notification_handler.run_scheduled_notifications"],
}

# ── Post migrate ──────────────────────────────────────────────────────────────
after_migrate = [
    "frappe_ui_enhancer.frappe_ui_enhancer.setup.after_migrate"
]
