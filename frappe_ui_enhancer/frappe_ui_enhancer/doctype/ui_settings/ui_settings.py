import frappe
from frappe.model.document import Document

class UISettings(Document):
    def on_update(self):
        # Clear all caches when settings change
        frappe.cache().delete_value("frappe_ui_enhancer_settings")
        frappe.cache().delete_keys("notif_rules_*")
