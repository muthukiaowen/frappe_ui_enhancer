# Frappe UI Enhancer v0.1.0
**By Cyvetech** · muthukiaowen@cyvetech.com

Full-stack UI customisation and event-driven real-time notifications for Frappe/ERPNext.

## Features

### UI Customisation (System Manager)
- Complete theme control: colors, typography, fonts, dark mode
- Login page designer: background, logo, tagline, box position
- Workspace designer: navbar, sidebar, header, footer, cards, tables
- Notification designer: toast colors, position, sound, animation
- Save and apply named Theme Presets
- Advanced: custom CSS/JS editor

### User Preferences (Per User)
- Personal accent color override
- Dark/light mode toggle
- Font size preference
- Workspace background
- Notification delivery preferences (sound, duration, mute hours)
- Personal CSS editor (if enabled by System Manager)

### Event-Driven Notifications
- Rules based on DocType events (On Submit, On Save, On Cancel, Daily, Weekly)
- Jinja2 message templates with doc field access
- Python condition expressions
- Real-time toast popups with read/unread tracking
- Bell icon with paginated sidebar panel
- Drill-down to linked documents

## Installation
```bash
bench get-app https://github.com/muthukiaowen/frappe_ui_enhancer --skip-assets
bench --site [sitename] install-app frappe_ui_enhancer
bench --site [sitename] migrate
bench build --app frappe_ui_enhancer
bench restart
```
