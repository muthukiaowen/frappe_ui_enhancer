import frappe
from frappe.utils import now_datetime
import json

# Module-level flag: set to True once we confirm our tables exist
_tables_ready = False


def _check_tables_ready():
    """
    Returns True only if both Notification Rule and Notification Log tables
    exist in the database. Caches the result at module level to avoid
    repeated DB calls. This prevents the infinite recursion that occurs
    when doc_events fires during bench migrate before our DocTypes are created.
    """
    global _tables_ready
    if _tables_ready:
        return True
    try:
        result = frappe.db.sql(
            """SELECT COUNT(*) FROM information_schema.tables
               WHERE table_schema = DATABASE()
               AND table_name IN ('tabNotification Rule', 'tabNotification Log')""")
        if result and result[0][0] >= 2:
            _tables_ready = True
            return True
        return False
    except Exception:
        return False


def handle_event(doc, method):
    """
    Fired for every document event via doc_events hook.
    The table guard is CRITICAL — without it, this function fires during
    bench migrate on Frappe's own DocTypes before our tables exist,
    causing frappe.log_error → Error Log insert → after_insert →
    handle_event infinite recursion and Python RecursionError.
    """
    if not _check_tables_ready():
        return

    try:
        event_map = {
            "after_insert": "After Insert",
            "on_update":    "On Save",
            "on_submit":    "On Submit",
            "on_cancel":    "On Cancel",
            "on_trash":     "On Delete",
        }
        event = event_map.get(method)
        if not event:
            return

        rules = _get_matching_rules(doc.doctype, event)
        for rule_name in rules:
            _process_rule(rule_name, doc)

    except Exception as e:
        try:
            frappe.log_error(
                title="Frappe UI Enhancer: Event Error",
                message=f"DocType:{doc.doctype} Method:{method}\n{e}"
            )
        except Exception:
            pass  # Never let error logging cause further recursion


def run_scheduled_notifications():
    """Run Daily and Weekly notification rules via scheduler."""
    try:
        if not _check_tables_ready():
            return
        schedule_types = ["Daily"]
        if frappe.utils.now_datetime().weekday() == 0:
            schedule_types.append("Weekly")
        for st in schedule_types:
            for r in frappe.get_all("Notification Rule", filters={"is_active":1,"event":st}, fields=["name"]):
                try:
                    _process_scheduled_rule(frappe.get_doc("Notification Rule", r.name))
                except Exception as e:
                    frappe.log_error(title="Frappe UI Enhancer: Scheduled Rule", message=str(e))
    except Exception as e:
        frappe.log_error(title="Frappe UI Enhancer: Scheduler", message=str(e))


def _get_matching_rules(doctype, event):
    cache_key = f"notif_rules_{doctype}_{event}"
    cached = frappe.cache().get_value(cache_key)
    if cached is not None:
        return json.loads(cached)
    rules = [r.name for r in frappe.get_all("Notification Rule",
        filters={"is_active":1,"document_type":doctype,"event":event}, fields=["name"])]
    frappe.cache().set_value(cache_key, json.dumps(rules), expires_in_sec=300)
    return rules


def _process_rule(rule_name, doc):
    rule = frappe.get_doc("Notification Rule", rule_name)
    if rule.condition:
        try:
            if not frappe.safe_eval(rule.condition, eval_locals={"doc": doc, "frappe": frappe}):
                return
        except Exception as e:
            frappe.log_error(title="Frappe UI Enhancer: Condition", message=f"Rule:{rule.name}\n{e}")
            return
    message = _render(rule.message_template, doc)
    title   = _render(rule.title, doc)
    for user in _get_users(rule):
        _deliver(rule, user, title, message, doc.doctype, doc.name)


def _process_scheduled_rule(rule):
    if not rule.document_type:
        return
    try:
        filters = json.loads(rule.condition) if rule.condition else {}
    except Exception:
        filters = {}
    for d in frappe.get_all(rule.document_type, filters=filters, fields=["name"], limit=100):
        doc = frappe.get_doc(rule.document_type, d.name)
        for user in _get_users(rule):
            _deliver(rule, user, _render(rule.title, doc), _render(rule.message_template, doc), doc.doctype, doc.name)


def _render(template, doc):
    if not template:
        return ""
    try:
        return frappe.render_template(template, {"doc": doc, "frappe": frappe})
    except Exception:
        return template


def _get_users(rule):
    return list(set(r.user for r in (rule.recipients or []) if r.user and frappe.db.exists("User", r.user)))


def _deliver(rule, user, title, message, link_doctype, link_name):
    if not _check_tables_ready():
        return
    if frappe.db.exists("Notification Log", {"rule":rule.name,"for_user":user,"link_doctype":link_doctype,"link_name":link_name}):
        return
    log = frappe.get_doc({
        "doctype":"Notification Log","rule":rule.name,"for_user":user,
        "title":title[:140],"message":message,"priority":rule.priority or "Info",
        "link_doctype":link_doctype,"link_name":link_name,
        "is_read":0,"delivered_at":now_datetime()
    })
    log.insert(ignore_permissions=True)
    frappe.publish_realtime(
        event="ui_enhancer_notification",
        message={"log_name":log.name,"title":log.title,"message":log.message,
                 "priority":log.priority,"link_doctype":link_doctype,"link_name":link_name},
        user=user, after_commit=True
    )
    frappe.db.commit()


@frappe.whitelist()
def get_notifications(page=1, page_size=10, filter_unread=False):
    user = frappe.session.user
    page, page_size = int(page), int(page_size)
    filters = {"for_user": user}
    if frappe.parse_json(filter_unread) if isinstance(filter_unread, str) else filter_unread:
        filters["is_read"] = 0
    total = frappe.db.count("Notification Log", filters)
    records = frappe.get_all("Notification Log", filters=filters,
        fields=["name","title","message","priority","link_doctype","link_name","is_read","read_at","delivered_at"],
        order_by="delivered_at desc", limit=page_size, start=(page-1)*page_size)
    return {"notifications":records,"total":total,
            "unread_count":frappe.db.count("Notification Log",{"for_user":user,"is_read":0}),
            "page":page,"page_size":page_size,"total_pages":max(1,-(-total//page_size))}


@frappe.whitelist()
def get_unread_count():
    return frappe.db.count("Notification Log", {"for_user":frappe.session.user,"is_read":0})


@frappe.whitelist()
def mark_as_read(log_name):
    doc = frappe.get_doc("Notification Log", log_name)
    if doc.for_user != frappe.session.user:
        frappe.throw("Not authorised.", frappe.PermissionError)
    if not doc.is_read:
        doc.db_set("is_read",1)
        doc.db_set("read_at",now_datetime())
        frappe.db.commit()
    return {"status":"ok","log_name":log_name}


@frappe.whitelist()
def mark_all_read():
    frappe.db.sql("UPDATE `tabNotification Log` SET is_read=1,read_at=%s WHERE for_user=%s AND is_read=0",
                  (now_datetime(), frappe.session.user))
    frappe.db.commit()
    return {"status":"ok"}


@frappe.whitelist()
def send_test_notification(rule_name):
    if "System Manager" not in frappe.get_roles(frappe.session.user):
        frappe.throw("Only System Manager can send test notifications.", frappe.PermissionError)
    rule = frappe.get_doc("Notification Rule", rule_name)
    _deliver(rule, frappe.session.user, f"[TEST] {rule.rule_name}",
             f"Test notification for rule: {rule.rule_name}", "Notification Rule", rule_name)
    return {"status":"sent"}
