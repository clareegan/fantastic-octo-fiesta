# Hand-Drawn Widgets Setup

These widgets match your hand-drawn icons and show live info: a month calendar, the time, the weather where you are, and your upcoming events. They run in the free **Scriptable** app.

## 1. Install Scriptable
Download **Scriptable** (by Simon Støvring) from the App Store and open it once so it creates its iCloud folder.

## 2. Copy the files
1. Unzip **Hand-Drawn-Widgets.zip** in the Files app (tap it).
2. Move the **HandDrawn** folder into **iCloud Drive › Scriptable**.
3. Also move **Hand-Drawn Widgets.js** into **iCloud Drive › Scriptable**. It now appears as a script in Scriptable.
4. Open Scriptable and tap the script once. Allow **Calendar** and **Location** access when asked, so the events and weather widgets work.

## 3. Add each widget
1. Long-press the home screen, tap **Edit › Add Widget**, pick **Scriptable**, and choose a size (Small, Medium or Large).
2. Long-press the new widget › **Edit Widget**.
3. **Script:** Hand-Drawn Widgets
4. **When Interacting:** Run Script (or Open URL — the widget opens the matching Apple app when tapped either way).
5. **Parameter:** type one of these:

| Parameter | Shows | Best sizes |
|---|---|---|
| `calendar` | Month grid with today circled | Small, Medium |
| `clock` | Live time and date | Small, Medium |
| `weather` | Temperature, conditions, and a 3-day forecast | Small, Medium |
| `events` | Your next events from the Calendar app (including Outlook if it syncs to your iPhone calendar) | Medium, Large |

Repeat for each widget you want.

## Notes
- The time updates live. Weather, calendar and events refresh about every 15 minutes (iOS decides the exact timing).
- Weather comes from the free Open-Meteo service. If location is off, it uses Louisville.
- To show Outlook events, turn on **Settings › Apps › Outlook › Calendars** sync, or add the account under **Settings › Apps › Calendar › Calendar Accounts**.
