# Healthy Living

A personal healthy living app for phone and laptop. It starts with a short questionnaire, turns your answers into daily targets, and gives you a quick daily log and progress charts.

**Your data stays on your device.** Everything is saved in your browser's local storage. Nothing is sent to a server, and nothing personal is stored in this repository.

## What it does

| Area | What you get |
| --- | --- |
| Questionnaire | 7 short screens: about you, goals, activity, food (including veg and non-veg days), sleep, mind and well-being, health notes |
| My plan | Daily calories (Mifflin-St Jeor), water, workout days and minutes, steps, sleep, mindful minutes, and one habit a week picked from your answers |
| Today | One-screen log: calories and rating per meal, water, activity, steps, sleep, mood, energy, stress, mindful minutes, connection, one good thing, weight, notes |
| Progress | 7 and 30 day stats, streaks, and charts for weight, sleep, mood, energy, stress, calories and activity |
| Settings | Export CSV for analysis, backup and restore (to move devices), units (US or metric), update answers, delete data |

## Use it

Open the GitHub Pages link: https://chandrukk.github.io/healthy-living/

- **iPhone:** open in Safari, tap Share, then **Add to Home Screen**.
- **Android:** open in Chrome, tap the menu, then **Install app**.
- **Laptop:** open the link in any browser. Phone and laptop keep separate data in V1. Use Settings, Download backup and Restore backup to move data between them.

## Run locally

No build step. From the repo folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

- `index.html`: page shell and tab bar
- `app.js`: questionnaire, plan engine, daily log, charts, export
- `styles.css`: phone-first layout with a laptop sidebar, light and dark mode
- `sw.js`, `manifest.webmanifest`, `icons/`: installable app and offline support

## CSV columns (for data science)

`date, weight_kg, water_glasses, activity_type, activity_minutes, steps, sleep_hours, sleep_quality, mood, energy, stress, mindful_minutes, connected, good_thing, habit_done, veg_day, calories_total, meal1..meal4, meal1_kcal..meal4_kcal, meal_note, notes`

## Disclaimer

General wellness targets from standard formulas, not medical advice. If you have a health condition, confirm targets with your doctor.
