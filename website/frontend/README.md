# Vedyam \u2014 Frontend

A static single-page app (vanilla HTML/CSS/JS, **no build step**). It is a separate
application that depends on the **Vedyam backend** over HTTP.

> \u26A0\uFE0F There is **no offline / standalone mode**. The frontend needs a running backend.
> If it can\u2019t reach the backend it shows a \u201Ccan\u2019t reach the backend\u201D notice.

## Configure the backend URL

Edit **`js/config.js`**:

```js
window.VEDYAM = {
  API_BASE: "http://127.0.0.1:8000", // where the backend runs
};
```

- Same origin as the backend? Use `API_BASE: ""`.
- Hosted separately? Point it at the backend\u2019s URL (the backend already sends permissive CORS headers).

## Run it

Any static file server works:

```bash
python3 -m http.server 5500     # then open http://127.0.0.1:5500
```

Make sure the backend is running first (see the backend README).

## Structure

```
frontend/
  index.html       app shell
  css/styles.css   design system (white-dominant, one accent)
  js/config.js     API_BASE \u2014 the only place the backend URL lives
  js/app.js        router + views + API client
```

## Demo accounts

| Role        | Email                   | Password |
|-------------|-------------------------|----------|
| Super Admin | superadmin@vedyam.org   | admin123 |
| Instructor  | instructor@vedyam.org   | teach123 |
| Learner     | user@vedyam.org         | learn123 |
