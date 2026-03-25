frappe.ui.form.on("Notification Rule", {
    refresh: function(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__("Send Test"), function() {
                frappe.call({
                    method: "frappe_ui_enhancer.utils.notification_handler.send_test_notification",
                    args: { rule_name: frm.doc.name },
                    freeze: true, freeze_message: __("Sending test..."),
                    callback: function(r) {
                        if (r.message && r.message.status === "sent") {
                            frappe.show_alert({ message: __("Test sent. Check your notification bell."), indicator: "green" }, 4);
                        }
                    }
                });
            }, __("Actions"));
        }
    }
});
