frappe.ui.form.on("UI Settings", {

    refresh: function(frm) {
        // Preset picker button
        frm.add_custom_button(__("Browse Presets"), function() {
            _showPresetPicker(frm);
        }, __("Theme"));

        // Live preview button
        frm.add_custom_button(__("Preview Theme"), function() {
            _applyLivePreview(frm);
        }, __("Theme"));

        // Refresh after save
        frm.add_custom_button(__("Refresh Theme"), function() {
            try { localStorage.removeItem("frappe_ui_enhancer_settings"); } catch(e) {}
            try { sessionStorage.removeItem("frappe_ui_enhancer_settings"); } catch(e) {}
            location.reload();
        });

        // Init gradient builders
        setTimeout(function() {
            _initGradientBuilder(frm, "login");
            _initGradientBuilder(frm, "workspace");
        }, 500);

        if (!frm.doc.enable_custom_theme) {
            frm.dashboard.set_headline_alert(
                '<b>Custom theme is disabled.</b> Enable the toggle above to activate all settings.',
                'yellow');
        }
    },

    after_save: function(frm) {
        try { localStorage.removeItem("frappe_ui_enhancer_settings"); } catch(e) {}
        try { sessionStorage.removeItem("frappe_ui_enhancer_settings"); } catch(e) {}
        frappe.show_alert({ message: __("Settings saved. Reload any open tabs to see changes."), indicator: "green" }, 5);
    },

    login_bg_type: function(frm) {
        if (frm.doc.login_bg_type === "Gradient")
            setTimeout(function() { _initGradientBuilder(frm, "login"); }, 300);
    },

    workspace_bg_type: function(frm) {
        if (frm.doc.workspace_bg_type === "Gradient")
            setTimeout(function() { _initGradientBuilder(frm, "workspace"); }, 300);
    },

    // Live preview on color change
    navbar_bg:        function(frm) { _debouncePreview(frm); },
    navbar_text:      function(frm) { _debouncePreview(frm); },
    primary_color:    function(frm) { _debouncePreview(frm); },
    accent_color:     function(frm) { _debouncePreview(frm); },
    sidebar_bg:       function(frm) { _debouncePreview(frm); },
});

// ── Preset Picker ─────────────────────────────────────────────────────────────
function _showPresetPicker(frm) {
    frappe.call({
        method: "frappe_ui_enhancer.api.get_theme_presets",
        callback: function(r) {
            if (!r.message || !r.message.length) {
                frappe.msgprint(__("No theme presets found."));
                return;
            }

            const presets = r.message;
            const cards   = presets.map(p => `
                <div class="enh-preset-card" data-name="${p.name}"
                     style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;
                            cursor:pointer;transition:border .15s;margin:0">
                    <div style="font-size:13px;font-weight:600;color:#1a1a1a">${p.preset_name}</div>
                    <div style="font-size:11px;color:#888;margin-top:3px">${p.description || ""}</div>
                </div>`).join("");

            const d = new frappe.ui.Dialog({
                title: __("Choose a Theme Preset"),
                fields: [{ fieldtype: "HTML", options: `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:4px 0">
                        ${cards}
                    </div>` }],
                primary_action_label: __("Close"),
                primary_action: function() { d.hide(); }
            });

            d.show();

            // Bind preset card clicks
            d.$wrapper.find(".enh-preset-card").on("click", function() {
                const name = $(this).data("name");
                frappe.confirm(
                    __("Apply preset <b>{0}</b>? This will overwrite your current color settings.", [name]),
                    function() {
                        frappe.call({
                            method: "frappe_ui_enhancer.api.apply_preset",
                            args: { preset_name: name },
                            freeze: true,
                            freeze_message: __("Applying preset..."),
                            callback: function(r) {
                                d.hide();
                                frm.reload_doc();
                                frappe.show_alert({
                                    message: __("Preset applied successfully."),
                                    indicator: "green"
                                }, 4);
                            }
                        });
                    }
                );
            }).hover(
                function() { $(this).css("border-color", "#2490EF"); },
                function() { $(this).css("border-color", "#e0e0e0"); }
            );
        }
    });
}

// ── Gradient Builder ───────────────────────────────────────────────────────────
function _initGradientBuilder(frm, prefix) {
    var el = document.getElementById(prefix + "-gradient-builder-target");
    if (!el || typeof window.EnhancerGradientBuilder === "undefined") return;
    window.EnhancerGradientBuilder.render(el, frm.doc[prefix + "_bg_gradient"] || "", function(css) {
        frm.set_value(prefix + "_bg_gradient", css);
    });
}

// ── Live Preview ──────────────────────────────────────────────────────────────
var _previewTimer = null;
function _debouncePreview(frm) {
    clearTimeout(_previewTimer);
    _previewTimer = setTimeout(function() { _applyLivePreview(frm); }, 600);
}

function _applyLivePreview(frm) {
    var r = document.documentElement;
    if (frm.doc.primary_color)  r.style.setProperty("--ui-primary", frm.doc.primary_color);
    if (frm.doc.accent_color)   r.style.setProperty("--ui-accent",  frm.doc.accent_color);
    if (frm.doc.navbar_bg) {
        document.querySelectorAll(".navbar,.navbar-header").forEach(function(el) {
            el.style.backgroundColor = frm.doc.navbar_bg;
        });
    }
    if (frm.doc.navbar_text) {
        document.querySelectorAll(".navbar .nav-link,.navbar .navbar-brand,.navbar svg").forEach(function(el) {
            el.style.color = frm.doc.navbar_text;
            el.style.stroke = frm.doc.navbar_text;
        });
    }
    if (frm.doc.sidebar_bg) {
        document.querySelectorAll(".body-sidebar").forEach(function(el) {
            el.style.backgroundColor = frm.doc.sidebar_bg;
        });
    }
    frappe.show_alert({ message: __("Live preview applied. Save to make permanent."), indicator: "blue" }, 3);
}
