// imports
importScripts("https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js");

importScripts("js/sw-db.js");
importScripts("js/sw-utils.js");

const STATIC_CACHE = "static-v2";
const DYNAMIC_CACHE = "dynamic-v1";
const INMUTABLE_CACHE = "inmutable-v1";

const APP_SHELL = [
  "/",
  "index.html",
  "css/style.css",
  "img/favicon.ico",
  "img/avatars/hulk.jpg",
  "img/avatars/ironman.jpg",
  "img/avatars/spiderman.jpg",
  "img/avatars/thor.jpg",
  "img/avatars/wolverine.jpg",
  "js/app.js",
  "js/sw-utils.js",
  "js/libs/plugins/mdtoast.min.js",
  "js/libs/plugins/mdtoast.min.css",
];

const APP_SHELL_INMUTABLE = [
  "https://fonts.googleapis.com/css?family=Quicksand:300,400",
  "https://fonts.googleapis.com/css?family=Lato:400,300",
  "https://use.fontawesome.com/releases/v5.3.1/css/all.css",
  "https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js",
  "https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js",
];

self.addEventListener("install", (e) => {
  const cacheStatic = caches
    .open(STATIC_CACHE)
    .then((cache) => cache.addAll(APP_SHELL));

  const cacheInmutable = caches
    .open(INMUTABLE_CACHE)
    .then((cache) => cache.addAll(APP_SHELL_INMUTABLE));

  e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));
});

self.addEventListener("activate", (e) => {
  const respuesta = caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== STATIC_CACHE && key.includes("static")) {
        return caches.delete(key);
      }

      if (key !== DYNAMIC_CACHE && key.includes("dynamic")) {
        return caches.delete(key);
      }
    });
  });

  e.waitUntil(respuesta);
});

self.addEventListener("fetch", (e) => {
  let respuesta;

  if (e.request.url.includes("/api")) {
    respuesta = manejoApiMensajes(DYNAMIC_CACHE, e.request);
  } else {
    respuesta = caches.match(e.request).then((res) => {
      if (res) {
        actualizaCacheStatico(STATIC_CACHE, e.request, APP_SHELL_INMUTABLE);
        return res;
      } else {
        return fetch(e.request).then((newRes) => {
          return actualizaCacheDinamico(DYNAMIC_CACHE, e.request, newRes);
        });
      }
    });
  }

  e.respondWith(respuesta);
});

// tareas asíncronas
self.addEventListener("sync", (e) => {
  console.log("SW: Sync");

  if (e.tag === "nuevo-post") {
    // postear a BD cuando hay conexión
    const respuesta = postearMensajes();

    e.waitUntil(respuesta);
  }
});

self.addEventListener("push", (e) => {
  const data = JSON.parse(e.data.text());

  const title = data.titulo;
  const options = {
    body: data.contenido,
    icon: `img/avatars/${data.usuario}.jpg`,
    badge: "img/favicon.ico",
    image:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.mirror.co.uk%2F3am%2Fcelebrity-news%2Fkanye-west-slams-ridiculous-illuminati-5559233&psig=AOvVaw0oYNUmoytFkTfDD-3JtSI5&ust=1677884312088000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCICf_q-svv0CFQAAAAAdAAAAABAE",
    vibrate: [1000, 225, 300, 500, 1000],
    data: {
      url: "https://www.google.com",
      id: data.usuario,
    },
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  const {notification, action } = e;

  const res = clients.matchAll().then((clts) => {
    let clienteOn = clts.find((cliente) => {
      return cliente.visibilityState === "visible";
    });
    if (clienteOn) {
      clienteOn.navigate(notification.data.url);
      clienteOn.focus();
    } else {
      clients.openWindows(notification.data.url);
    }
    return notification.close();
  });
  

  e.waitUntil(res);
});
