"""
Frappe UI Enhancer — Asset Server
Serves CSS and JS directly via Python/gunicorn, bypassing nginx entirely.
This solves the Docker separate-volume problem permanently.

URLs:
  /api/method/frappe_ui_enhancer.serve.css  → returns our CSS
  /api/method/frappe_ui_enhancer.serve.js   → returns our JS
"""
import os
import frappe
from frappe import _


def css():
    """Serve the UI Enhancer CSS with correct content-type."""
    frappe.local.response.update({
        "type": "text/css; charset=utf-8",
    })
    return _read_asset("css", "frappe_ui_enhancer.css")


def js():
    """Serve the UI Enhancer JS with correct content-type."""
    frappe.local.response.update({
        "type": "application/javascript; charset=utf-8",
    })
    return _read_asset("js", "frappe_ui_enhancer.js")


def _read_asset(folder, filename):
    try:
        app_path = frappe.get_app_path("frappe_ui_enhancer")
        file_path = os.path.join(app_path, "public", folder, filename)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            frappe.local.response["http_status_code"] = 200
            return content
        else:
            frappe.local.response["http_status_code"] = 404
            return f"/* {filename} not found */"
    except Exception as e:
        frappe.local.response["http_status_code"] = 500
        return f"/* Error loading {filename}: {e} */"
