import frappe
from frappe.model.document import Document

class UserUIPreferences(Document):
    def validate(self):
        # Ensure the user field matches the document name
        if not self.user:
            self.user = frappe.session.user
