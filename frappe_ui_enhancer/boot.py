"""
Frappe UI Enhancer — Boot Session Hook
Injects our CSS and JS inline via Frappe's boot response.
This bypasses the nginx/Docker volume asset serving problem entirely.
The files are read from the app package and embedded in the page.
"""
import os
import frappe


def inject_assets(bootinfo):
    """
    Called by Frappe on every desk boot. Adds our CSS and JS
    to the boot response so they are loaded inline — no nginx needed.
    """
    try:
        app_path = frappe.get_app_path("frappe_ui_enhancer")

        css_path = os.path.join(app_path, "public", "css", "frappe_ui_enhancer.css")
        js_path  = os.path.join(app_path, "public", "js",  "frappe_ui_enhancer.js")

        if os.path.exists(css_path):
            with open(css_path, "r") as f:
                css = f.read()
            if not hasattr(bootinfo, "inline_css"):
                bootinfo.inline_css = ""
            bootinfo.inline_css += "\n/* Frappe UI Enhancer */\n" + css

        if os.path.exists(js_path):
            with open(js_path, "r") as f:
                js = f.read()
            if not hasattr(bootinfo, "inline_js"):
                bootinfo.inline_js = ""
            bootinfo.inline_js += "\n/* Frappe UI Enhancer */\n" + js

    except Exception as e:
        frappe.log_error(
            title="Frappe UI Enhancer: Boot Error",
            message=str(e)
        )
