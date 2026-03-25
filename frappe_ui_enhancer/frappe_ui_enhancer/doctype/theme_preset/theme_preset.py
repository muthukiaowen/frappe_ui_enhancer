import frappe
from frappe.model.document import Document

class ThemePreset(Document):
    def after_insert(self):
        frappe.cache().delete_value("frappe_ui_enhancer_settings")

    def on_update(self):
        frappe.cache().delete_value("frappe_ui_enhancer_settings")
