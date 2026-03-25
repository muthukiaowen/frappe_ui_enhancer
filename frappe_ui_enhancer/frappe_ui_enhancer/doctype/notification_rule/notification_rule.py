import frappe
from frappe.model.document import Document

class NotificationRule(Document):
    def validate(self):
        if self.condition:
            try:
                compile(self.condition, "<string>", "eval")
            except SyntaxError as e:
                frappe.throw(f"Invalid condition syntax: {e}")

    def on_update(self):
        frappe.cache().delete_keys("notif_rules_*")
