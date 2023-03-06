var url = window.location.href;
var swLocation = "/twittor/sw.js";
var swReg;

window.addEventListener("load", (e) => {
  if (navigator.serviceWorker) {
    if (url.includes("localhost")) {
      swLocation = "/sw.js";
    }
    navigator.serviceWorker.register(swLocation).then((reg) => {
      swReg = reg;
      swReg.pushManager
        .getSubscription()
        .then(verificarSubscripcion)
        .catch(console.log);
    });
  }
});

// Referencias de jQuery

var titulo = $("#titulo");
var nuevoBtn = $("#nuevo-btn");
var salirBtn = $("#salir-btn");
var cancelarBtn = $("#cancel-btn");
var postBtn = $("#post-btn");
var avatarSel = $("#seleccion");
var timeline = $("#timeline");

var modal = $("#modal");
var modalAvatar = $("#modal-avatar");
var avatarBtns = $(".seleccion-avatar");
var txtMensaje = $("#txtMensaje");

var btnActivadas = $(".btn-noti-activadas");
var btnDesactivadas = $(".btn-noti-desactivadas");

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;

// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {
  var content = `
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${personaje}.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${personaje}</h3>
                <br/>
                ${mensaje}
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

  timeline.prepend(content);
  cancelarBtn.click();
}

// Globals
function logIn(ingreso) {
  if (ingreso) {
    nuevoBtn.removeClass("oculto");
    salirBtn.removeClass("oculto");
    timeline.removeClass("oculto");
    avatarSel.addClass("oculto");
    modalAvatar.attr("src", "img/avatars/" + usuario + ".jpg");
  } else {
    nuevoBtn.addClass("oculto");
    salirBtn.addClass("oculto");
    timeline.addClass("oculto");
    avatarSel.removeClass("oculto");

    titulo.text("Seleccione Personaje");
  }
}

// Seleccion de personaje
avatarBtns.on("click", function () {
  usuario = $(this).data("user");

  titulo.text("@" + usuario);

  logIn(true);
});

// Boton de salir
salirBtn.on("click", function () {
  logIn(false);
});

// Boton de nuevo mensaje
nuevoBtn.on("click", function () {
  modal.removeClass("oculto");
  modal.animate(
    {
      marginTop: "-=1000px",
      opacity: 1,
    },
    200
  );
});

// Boton de cancelar mensaje
cancelarBtn.on("click", function () {
  if (!modal.hasClass("oculto")) {
    modal.animate(
      {
        marginTop: "+=1000px",
        opacity: 0,
      },
      200,
      function () {
        modal.addClass("oculto");
        txtMensaje.val("");
      }
    );
  }
});

// Boton de enviar mensaje
postBtn.on("click", function () {
  var mensaje = txtMensaje.val();
  if (mensaje.length === 0) {
    cancelarBtn.click();
    return;
  }

  var data = {
    mensaje: mensaje,
    user: usuario,
  };

  fetch("api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => console.log("app.js", res))
    .catch((err) => console.log("app.js error:", err));

  crearMensajeHTML(mensaje, usuario);
});

// Obtener mensajes del servidor
function getMensajes() {
  fetch("api")
    .then((res) => res.json())
    .then((posts) => {
      posts.forEach((post) => crearMensajeHTML(post.mensaje, post.user));
    });
}

getMensajes();

// Detectar cambios de conexión
function isOnline() {
  if (navigator.onLine) {
    // tenemos conexión
    // console.log('online');
    $.mdtoast("Online", {
      interaction: true,
      interactionTimeout: 1000,
      actionText: "OK!",
    });
  } else {
    // No tenemos conexión
    $.mdtoast("Offline", {
      interaction: true,
      actionText: "OK",
      type: "warning",
    });
  }
}

window.addEventListener("online", isOnline);
window.addEventListener("offline", isOnline);

isOnline();

// notificaciones

function verificarSubscripcion(activated) {
  if (activated) {
    btnActivadas.removeClass("oculto");
    btnDesactivadas.addClass("oculto");
  } else {
    btnDesactivadas.removeClass("oculto");
    btnActivadas.addClass("oculto");
  }
}

function customNotificaction() {
  const options = {
    body: "Cuerpo",
    icon: "img/icons/icon-72x72.png",
  };
  const n = new Notification("hola mundo", options);
  n.onclick = () => {
    console.log("click");
  };
}

function notificarme() {
  if (!window.Notification) {
    console.log("No posee notificaciones");
    return;
  }
  const permission = Notification.permission;
  if (permission === "granted") {
    customNotificaction();
  } else if (permission !== "denied" || permission === "default") {
    Notification.requestPermission(function (permission) {
      console.log(permission);
      if (permission === "granted") {
        customNotificaction();
      }
    });
  }
}

//get key

async function getPublickey() {
  return fetch("api/key")
    .then((res) => res.arrayBuffer())
    .then((key) => new Uint8Array(key))
    .catch(console.log);
}

btnDesactivadas.on("click", () => {
  if (!swReg) return console.log("no existe sw");
  getPublickey().then((key) => {
    swReg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      })
      .then((res) => res.toJSON())
      .then((sub) => {
        fetch("api/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sub),
        })
          .then(verificarSubscripcion)
          .catch(console.log);
      });
  });
});

function cancelarSub() {
  swReg.pushManager.getSubscription().then((sub) => {
    console.log(sub)
    sub.unsubscribe().then(() =>
            verificarSubscripcion(false)
        ).catch(console.log);
  });
}

btnActivadas.on('click', ()=>{
    cancelarSub();
})