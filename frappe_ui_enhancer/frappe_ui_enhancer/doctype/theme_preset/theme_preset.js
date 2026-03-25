frappe.ui.form.on("Theme Preset", {
    refresh: function(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__("Apply to Site"), function() {
                frappe.confirm(
                    __("Apply preset <b>{0}</b> to your site? This will overwrite current UI Settings.", [frm.doc.preset_name]),
                    function() {
                        frappe.call({
                            method: "frappe_ui_enhancer.api.apply_preset",
                            args: { preset_name: frm.doc.name },
                            freeze: true, freeze_message: __("Applying..."),
                            callback: function() {
                                frappe.show_alert({ message: __("Preset applied."), indicator: "green" }, 4);
                            }
                        });
                    }
                );
            }, __("Actions"));
        }
    }
});
