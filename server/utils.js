const fs = require("fs");

let subscritions = require("./subs-db.json");

const { publicKey, privateKey } = require("./vapid.json");
const webPush = require("web-push");
const config = require("./config");
const dbRoute = `${__dirname}/subs-db.json`;

webPush.setVapidDetails(`mailto:${config.EMAIL}`, publicKey, privateKey);

module.exports.push = (sub) => {
  subscritions.push(sub);
  fs.writeFileSync(dbRoute, JSON.stringify(subscritions));
};

module.exports.get = () => {
  return subscritions;
};

module.exports.sendPush = (post) => {

  const notificacionesEnviadas = [];

  subscritions.forEach((sub, i) => {
    const pushProm = webPush.sendNotification(sub, JSON.stringify(post))
      .then(console.log('send'))
      .catch(err => {
          if (err.statusCode === 410) {
            subscritions[i].borrar = true;
          }
      })
      notificacionesEnviadas.push(pushProm);
  });

  Promise.all(notificacionesEnviadas)
    .then(console.log)
    .catch( err => {
      subscritions = subscritions.filter(subs => !subs.borrar);
      fs.writeFileSync(dbRoute, JSON.stringify(subscritions));
    })
};
