import frappe

def after_migrate():
    _ensure_module_def()
    _ensure_ui_settings()
    _seed_builtin_presets()

def _ensure_module_def():
    try:
        if not frappe.db.exists("Module Def", "Frappe UI Enhancer"):
            frappe.get_doc({
                "doctype": "Module Def",
                "module_name": "Frappe UI Enhancer",
                "app_name": "frappe_ui_enhancer"
            }).insert(ignore_permissions=True)
            frappe.db.commit()
    except Exception as e:
        print(f"UI Enhancer setup: Module Def - {e}")

def _ensure_ui_settings():
    try:
        if not frappe.db.exists("UI Settings", "UI Settings"):
            frappe.get_doc({
                "doctype": "UI Settings",
                "enable_custom_theme": 0,
                "logo_width": 120,
                "font_size_base": "14px",
                "border_radius": "6px",
                "navbar_height": "48px",
                "toast_position": "top-right",
                "toast_duration_info": 8000,
                "toast_duration_warning": 12000,
                "login_bg_type": "None",
                "login_box_position": "center",
                "login_box_radius": "8px",
                "workspace_bg_type": "None",
                "allow_user_customisation": 0,
                "allow_user_custom_css": 0,
                "show_footer": 0,
            }).insert(ignore_permissions=True)
            frappe.db.commit()
    except Exception as e:
        print(f"UI Enhancer setup: UI Settings - {e}")

def _seed_builtin_presets():
    """Create built-in theme presets if they don't exist."""
    presets = [
        {
            "preset_name": "Corporate Blue",
            "description": "Clean professional blue — ideal for finance and enterprise",
            "primary_color": "#1565C0", "secondary_color": "#E3F2FD",
            "accent_color": "#2196F3", "text_color": "#212121",
            "navbar_bg": "#0D47A1", "navbar_text": "#FFFFFF",
            "sidebar_bg": "#0D47A1", "sidebar_text": "#E3F2FD",
            "sidebar_active_bg": "#1565C0", "sidebar_active_text": "#FFFFFF",
            "btn_primary_bg": "#1565C0", "btn_primary_text": "#FFFFFF",
            "btn_primary_hover": "#0D47A1", "border_radius": "6px",
        },
        {
            "preset_name": "Earth Tone",
            "description": "Warm earthy browns — ideal for agriculture and manufacturing",
            "primary_color": "#5D4037", "secondary_color": "#EFEBE9",
            "accent_color": "#795548", "text_color": "#3E2723",
            "navbar_bg": "#4E342E", "navbar_text": "#FFFFFF",
            "sidebar_bg": "#4E342E", "sidebar_text": "#EFEBE9",
            "sidebar_active_bg": "#5D4037", "sidebar_active_text": "#FFFFFF",
            "btn_primary_bg": "#5D4037", "btn_primary_text": "#FFFFFF",
            "btn_primary_hover": "#4E342E", "border_radius": "4px",
        },
        {
            "preset_name": "Midnight Dark",
            "description": "Dark modern theme — reduces eye strain for long sessions",
            "primary_color": "#1E1E2E", "secondary_color": "#313244",
            "accent_color": "#CBA6F7", "text_color": "#CDD6F4",
            "navbar_bg": "#11111B", "navbar_text": "#CDD6F4",
            "sidebar_bg": "#181825", "sidebar_text": "#CDD6F4",
            "sidebar_active_bg": "#313244", "sidebar_active_text": "#CBA6F7",
            "btn_primary_bg": "#CBA6F7", "btn_primary_text": "#1E1E2E",
            "btn_primary_hover": "#B4A0E0", "border_radius": "8px",
        },
        {
            "preset_name": "Soft Green",
            "description": "Fresh natural green — ideal for health and sustainability",
            "primary_color": "#2E7D32", "secondary_color": "#E8F5E9",
            "accent_color": "#43A047", "text_color": "#1A1A1A",
            "navbar_bg": "#1B5E20", "navbar_text": "#FFFFFF",
            "sidebar_bg": "#1B5E20", "sidebar_text": "#E8F5E9",
            "sidebar_active_bg": "#2E7D32", "sidebar_active_text": "#FFFFFF",
            "btn_primary_bg": "#2E7D32", "btn_primary_text": "#FFFFFF",
            "btn_primary_hover": "#1B5E20", "border_radius": "6px",
        },
        {
            "preset_name": "Rose Gold",
            "description": "Elegant rose gold — ideal for retail and hospitality",
            "primary_color": "#AD1457", "secondary_color": "#FCE4EC",
            "accent_color": "#E91E63", "text_color": "#212121",
            "navbar_bg": "#880E4F", "navbar_text": "#FFFFFF",
            "sidebar_bg": "#880E4F", "sidebar_text": "#FCE4EC",
            "sidebar_active_bg": "#AD1457", "sidebar_active_text": "#FFFFFF",
            "btn_primary_bg": "#AD1457", "btn_primary_text": "#FFFFFF",
            "btn_primary_hover": "#880E4F", "border_radius": "20px",
        },
    ]

    for p in presets:
        if not frappe.db.exists("Theme Preset", {"preset_name": p["preset_name"]}):
            try:
                doc = frappe.get_doc({"doctype": "Theme Preset", "is_active": 1, **p})
                doc.insert(ignore_permissions=True)
            except Exception as e:
                print(f"UI Enhancer: Could not seed preset {p['preset_name']} - {e}")

    if presets:
        frappe.db.commit()
