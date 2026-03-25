import frappe
import json

@frappe.whitelist(allow_guest=True)
def get_ui_settings():
    """
    Returns merged UI config: global settings overridden by user preferences.
    allow_guest=True so login page loads branding before authentication.
    """
    try:
        if not frappe.db.exists("DocType", "UI Settings"):
            return {}

        global_settings = _get_global_settings()
        if not global_settings:
            return {}

        # Merge user preferences on top (authenticated users only)
        if frappe.session.user and frappe.session.user != "Guest":
            user_prefs = _get_user_preferences(frappe.session.user)
            if user_prefs:
                global_settings.update({k: v for k, v in user_prefs.items() if v})

        return global_settings
    except Exception:
        return {}


def _get_global_settings():
    """Returns global UI settings if custom theme is enabled."""
    s = frappe.get_single("UI Settings")
    if not s.enable_custom_theme:
        return {}

    return {
        # ── Theme ─────────────────────────────────────────────────────────────
        "primary_color":         s.primary_color,
        "secondary_color":       s.secondary_color,
        "accent_color":          s.accent_color,
        "text_color":            s.text_color,
        "link_color":            s.link_color,
        "success_color":         s.success_color,
        "warning_color":         s.warning_color,
        "danger_color":          s.danger_color,

        # ── Typography ────────────────────────────────────────────────────────
        "font_family":           s.font_family,
        "font_size_base":        s.font_size_base or "14px",
        "font_weight_normal":    s.font_weight_normal or "400",
        "font_weight_bold":      s.font_weight_bold or "600",
        "border_radius":         s.border_radius or "6px",

        # ── Navbar ────────────────────────────────────────────────────────────
        "navbar_bg":             s.navbar_bg,
        "navbar_text":           s.navbar_text,
        "navbar_height":         s.navbar_height or "48px",

        # ── Sidebar ───────────────────────────────────────────────────────────
        "sidebar_bg":            s.sidebar_bg,
        "sidebar_text":          s.sidebar_text,
        "sidebar_active_bg":     s.sidebar_active_bg,
        "sidebar_active_text":   s.sidebar_active_text,

        # ── Page & Cards ──────────────────────────────────────────────────────
        "page_bg":               s.page_bg,
        "card_bg":               s.card_bg,
        "card_border":           s.card_border,

        # ── Buttons ───────────────────────────────────────────────────────────
        "btn_primary_bg":        s.btn_primary_bg,
        "btn_primary_text":      s.btn_primary_text,
        "btn_primary_hover":     s.btn_primary_hover,
        "btn_secondary_bg":      s.btn_secondary_bg,
        "btn_secondary_text":    s.btn_secondary_text,

        # ── Inputs ────────────────────────────────────────────────────────────
        "input_bg":              s.input_bg,
        "input_border":          s.input_border,
        "input_text":            s.input_text,
        "input_focus_border":    s.input_focus_border,
        "label_color":           s.label_color,

        # ── Tables ────────────────────────────────────────────────────────────
        "table_head_bg":         s.table_head_bg,
        "table_head_text":       s.table_head_text,
        "table_row_bg":          s.table_row_bg,
        "table_row_alt_bg":      s.table_row_alt_bg,
        "table_row_text":        s.table_row_text,
        "table_border":          s.table_border,

        # ── Footer ────────────────────────────────────────────────────────────
        "footer_bg":             s.footer_bg,
        "footer_text":           s.footer_text,
        "footer_content":        s.footer_content,
        "show_footer":           s.show_footer,

        # ── Logo ──────────────────────────────────────────────────────────────
        "company_logo":          s.company_logo,
        "logo_width":            int(s.logo_width or 120),
        "company_tagline":       s.company_tagline,

        # ── Login page ────────────────────────────────────────────────────────
        "login_bg_type":         s.login_bg_type,
        "login_bg_color":        s.login_bg_color,
        "login_bg_gradient":     s.login_bg_gradient,
        "login_bg_image":        s.login_bg_image,
        "login_bg_blur":         s.login_bg_blur or 0,
        "login_bg_overlay":      s.login_bg_overlay or 0,
        "login_box_bg":          s.login_box_bg,
        "login_box_position":    s.login_box_position or "center",
        "login_box_radius":      s.login_box_radius or "8px",
        "login_btn_bg":          s.login_btn_bg,
        "login_btn_text":        s.login_btn_text,
        "login_title":           s.login_title,
        "login_subtitle":        s.login_subtitle,

        # ── Workspace background ──────────────────────────────────────────────
        "workspace_bg_type":     s.workspace_bg_type,
        "workspace_bg_color":    s.workspace_bg_color,
        "workspace_bg_gradient": s.workspace_bg_gradient,
        "workspace_bg_image":    s.workspace_bg_image,

        # ── Notifications ─────────────────────────────────────────────────────
        "toast_position":        s.toast_position or "top-right",
        "toast_duration_info":   s.toast_duration_info or 8000,
        "toast_duration_warning":s.toast_duration_warning or 12000,
        "toast_info_bg":         s.toast_info_bg or "#EAF4FE",
        "toast_info_color":      s.toast_info_color or "#2490EF",
        "toast_warning_bg":      s.toast_warning_bg or "#FFF8EC",
        "toast_warning_color":   s.toast_warning_color or "#F5A623",
        "toast_critical_bg":     s.toast_critical_bg or "#FEECEC",
        "toast_critical_color":  s.toast_critical_color or "#E53935",
        "notification_sound":    s.notification_sound,

        # ── Advanced CSS ──────────────────────────────────────────────────────
        "custom_css":            s.custom_css,
        "allow_user_customisation": s.allow_user_customisation,
        "allow_user_custom_css": s.allow_user_custom_css,
    }


def _get_user_preferences(user):
    """Returns user's personal overrides."""
    try:
        if not frappe.db.exists("User UI Preferences", user):
            return {}
        prefs = frappe.get_doc("User UI Preferences", user)
        result = {}
        if prefs.accent_color:      result["accent_color"]    = prefs.accent_color
        if prefs.dark_mode:         result["dark_mode"]        = prefs.dark_mode
        if prefs.font_size:         result["font_size_base"]   = prefs.font_size
        if prefs.workspace_bg_type: result["workspace_bg_type"]= prefs.workspace_bg_type
        if prefs.workspace_bg_color:result["workspace_bg_color"]=prefs.workspace_bg_color
        if prefs.workspace_bg_image:result["workspace_bg_image"]=prefs.workspace_bg_image
        if prefs.custom_css:        result["user_custom_css"]  = prefs.custom_css
        result["notif_sound"]    = prefs.notification_sound
        result["notif_duration"] = prefs.toast_duration or 0
        result["notif_mute_from"]= prefs.mute_from
        result["notif_mute_to"]  = prefs.mute_to
        return result
    except Exception:
        return {}


@frappe.whitelist()
def get_theme_presets():
    """Returns all saved theme presets for the preset picker."""
    presets = frappe.get_all("Theme Preset",
        filters={"is_active": 1},
        fields=["name", "preset_name", "description", "thumbnail"],
        order_by="preset_name asc"
    )
    return presets


@frappe.whitelist()
def apply_preset(preset_name):
    """Applies a Theme Preset to UI Settings. System Manager only."""
    if "System Manager" not in frappe.get_roles(frappe.session.user):
        frappe.throw("Only System Manager can apply theme presets.", frappe.PermissionError)

    preset = frappe.get_doc("Theme Preset", preset_name)
    settings = frappe.get_single("UI Settings")

    # Copy all color/style fields from preset to settings
    color_fields = [
        "primary_color", "secondary_color", "accent_color", "text_color",
        "navbar_bg", "navbar_text", "sidebar_bg", "sidebar_text",
        "sidebar_active_bg", "sidebar_active_text", "page_bg", "card_bg",
        "btn_primary_bg", "btn_primary_text", "btn_primary_hover",
        "font_family", "font_size_base", "border_radius",
        "login_bg_type", "login_bg_color", "login_bg_gradient",
        "login_box_bg", "login_btn_bg", "login_btn_text",
    ]
    for field in color_fields:
        val = preset.get(field)
        if val and hasattr(settings, field):
            setattr(settings, field, val)

    settings.save(ignore_permissions=True)
    frappe.cache().delete_value("frappe_ui_enhancer_settings")
    frappe.db.commit()
    return {"status": "applied", "preset": preset_name}


@frappe.whitelist()
def save_user_preferences(prefs_json):
    """Save the current user's personal UI preferences."""
    user  = frappe.session.user
    prefs = frappe.parse_json(prefs_json)

    if frappe.db.exists("User UI Preferences", user):
        doc = frappe.get_doc("User UI Preferences", user)
    else:
        doc = frappe.get_doc({"doctype": "User UI Preferences", "user": user})

    allowed = ["accent_color","dark_mode","font_size","workspace_bg_type",
               "workspace_bg_color","workspace_bg_image","notification_sound",
               "toast_duration","mute_from","mute_to","custom_css"]

    # Verify user custom CSS is allowed
    global_settings = frappe.get_single("UI Settings")
    if "custom_css" in prefs and not global_settings.allow_user_custom_css:
        prefs.pop("custom_css")

    for field in allowed:
        if field in prefs and hasattr(doc, field):
            setattr(doc, field, prefs[field])

    if doc.is_new():
        doc.insert(ignore_permissions=True)
    else:
        doc.save(ignore_permissions=True)

    frappe.db.commit()
    return {"status": "saved"}
