# Birthday scrapbook

A private, paper-style scrapbook you can fill with polaroids, videos, and letters.

Everything stays in this browser on this computer (IndexedDB). Nothing is uploaded.

## Run it

From this folder:

```bash
python3 -m http.server 5173
```

Then open [http://localhost:5173](http://localhost:5173).

## How to use

Everything runs from the cover, then the floating bar at the bottom of the page.

1. Open the diary from the cover. Press **cover** in the year tabs to return.

1. Use the numbered tabs to move between birthday pages.
2. Press **new birthday page** to add the next age. Each page has its own
   date, headline, photos, videos, and letters.
3. Open the **page details** control (last icon) to edit the current page,
   or to **delete this page** if it was added by mistake. Hover a year tab
   and press × to delete it. The last remaining page cannot be deleted.
4. Add **photos**, **videos**, and **letters** with the first three icons.
5. Click a card to open it full size. Hover a card and press × to remove it.

Confetti drifts down slowly on its own, puffs when you add something, and
settles around the heading if you click it. It respects the system
"reduce motion" setting.
