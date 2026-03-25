frappe.ui.form.on("Notification Log", {
    refresh: function(frm) {
        if (!frm.doc.is_read) {
            frm.add_custom_button(__("Mark as Read"), function() {
                frappe.call({
                    method: "frappe_ui_enhancer.utils.notification_handler.mark_as_read",
                    args: { log_name: frm.doc.name },
                    callback: function() { frm.reload_doc(); }
                });
            });
        }
        if (frm.doc.link_doctype && frm.doc.link_name) {
            frm.add_custom_button(__("Open {0}", [frm.doc.link_doctype]), function() {
                frappe.set_route(frm.doc.link_doctype, frm.doc.link_name);
            }, __("Links"));
        }
    }
});
