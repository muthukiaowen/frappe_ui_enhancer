frappe.ui.form.on("User UI Preferences", {
    refresh: function(frm) {
        frm.add_custom_button(__("Apply Preview"), function() {
            if (frm.doc.accent_color) {
                document.documentElement.style.setProperty("--ui-accent", frm.doc.accent_color);
            }
            frappe.show_alert({ message: __("Preview applied. Save to persist."), indicator: "blue" }, 3);
        });

        frm.add_custom_button(__("Reset to Defaults"), function() {
            frappe.confirm(__("Reset all your personal UI preferences?"), function() {
                frappe.call({
                    method: "frappe_ui_enhancer.api.save_user_preferences",
                    args: { prefs_json: JSON.stringify({
                        accent_color: "", dark_mode: 0, font_size: "",
                        workspace_bg_type: "None", custom_css: ""
                    })},
                    callback: function() {
                        frm.reload_doc();
                        frappe.show_alert({ message: __("Preferences reset."), indicator: "green" }, 3);
                    }
                });
            });
        });
    }
});
