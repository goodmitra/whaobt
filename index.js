/*const {
  default: makeWASocket,
  useSingleFileAuthState,
} = require("@adiwajshing/baileys");*/
/*
const {  default: makeWASocket,  DisconnectReason,  useSingleFileAuthState,MessageType, MessageOptions, Mimetype
} = require("@adiwajshing/baileys");*/

const {
  default: makeWASocket,
MessageType, 
MessageOptions, 
Mimetype,
DisconnectReason,
BufferJSON,
AnyMessageContent, 
delay, 
fetchLatestBaileysVersion, 
isJidBroadcast, 
makeCacheableSignalKeyStore, 
makeInMemoryStore, 
MessageRetryMap, 
useMultiFileAuthState ,
msgRetryCounterMap
} =require("@adiwajshing/baileys");

process.setMaxListeners(0);

const http = require("http");
const { Boom } =require("@hapi/boom");
const express = require("express");
const bodyParser = require("body-parser");
const port = 9000;
const fs = require("fs");
const qrcode = require("qrcode");
const log = (pino = require("pino"));
const socketIO = require("socket.io");
const { body, validationResult } = require("express-validator");
const { classicNameResolver } = require("typescript");
const fileUpload = require("express-fileupload");

const con = require("./core/core.js");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// config cors
// const io = require("socket.io")(server, {
//   cors: {
//     origin: "https://stiker-label.com",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

let x;

const path = "./core/";
let sock;
let qr1;
let qr;
let soket;
app.use(fileUpload({
  createParentPath: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
async function connectToWhatsApp(device) {
	//const { state, saveCreds } = await useSingleFileAuthState('baileys_auth_info')
  console.log('Connected to WhatsApp!'+device+'this') 
  const { state, saveCreds } = await useMultiFileAuthState('auth'+device);
  let { version, isLatest } = await fetchLatestBaileysVersion(); 
   // const conn = new WAConnection()  
   // await conn.connect()  
   // console.log('Connected to WhatsApp!')  
sock = makeWASocket({
  printQRInTerminal: false,
  auth: state,
  logger: log({ level: "silent" }),
  browser: ["FFA", "EDGE", "1.0"],
  version,
  shouldIgnoreJid: jid => isJidBroadcast(jid),
}); 
store.bind(sock.ev);
sock.multi = true
io.on("connection", (socket) => {
  socket.on("StartConnection", async (device) => {
    if (fs.existsSync(path.concat(device) + ".json")) {
      socket.emit("message", "Whatsapp connected");
      socket.emit("ready", device);
      console.log(`Please Delete ${device} and Scan Again`);
    } else {             
      sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        if (qr) {
          qrcode.toDataURL(qr, (err, url) => {
            socket.emit("qr", url);
            socket.emit("message", "QR Code received, scan please!");
          });
        }       
        if (connection == "close") {
          let reason = new Boom(lastDisconnect.error).output.statusCode;
          if (reason === DisconnectReason.badSession) {
            console.log(`Bad Session File, Please Delete ${device} and Scan Again`);
            sock.logout();
          }             
            else if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed, reconnecting....");
            connectToWhatsApp(device);
          } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection Lost from Server, reconnecting...");
            connectToWhatsApp(device);
          } else if (reason === DisconnectReason.connectionReplaced) {
            console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
            sock.logout();
          } else if (reason === DisconnectReason.loggedOut) {
            console.log(`Device Logged Out, Please Delete ${device} and Scan Again.`);
            sock.logout();
          } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart Required, Restarting...");
            connectToWhatsApp(device);
          } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection TimedOut, Reconnecting...");
            connectToWhatsApp(device);
          } else {
            sock.end(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
          }
        //  con.gas(null, device);
          console.log(device);
          socket.emit("message", "Whatsapp connected");
          socket.emit("ready", device);
        }
        if(connection === 'open') {
          console.log('opened connection');
          socket.emit("message", "Whatsapp connected");
          socket.emit("ready", device);
            } 
        console.log(connection);
      });
      sock.ev.on("creds.update", saveCreds);
      sock.ev.on("messages.upsert", async ({ messages, type }) => {
        //console.log(messages);
        if(type === "notify"){
            if(!messages[0].key.fromMe) {
                //tentukan jenis pesan berbentuk text                
                const pesan = messages[0].message.conversation;
				
				//nowa dari pengirim pesan sebagai id
                const noWa = messages[0].key.remoteJid;

                await sock.readMessages([messages[0].key]);

                //kecilkan semua pesan yang masuk lowercase 
                const pesanMasuk = pesan.toLowerCase();
				
                if(!messages[0].key.fromMe && pesanMasuk === "ping"){
                    await sock.sendMessage(noWa, {text: "Pong"},{quoted: messages[0] });
                }else{
                    await sock.sendMessage(noWa, {text: "Saya adalah Bot!"},{quoted: messages[0] });
                }
			}		
		}		
    });
    }
  });

  socket.on("LogoutDevice", (device) => {
    if (fs.existsSync(path.concat(device) + ".json")) {
      fs.unlinkSync(path.concat(device) + ".json");
      console.log("logout device " + device);
      socket.emit("message", "logout device " + device);
    }
    return;
  });
});

}

const isConnected = () => {
  console.log('isconn fun- '+sock.user);
  return (sock.user);  
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/core/device.html");
});

app.get("/device", (req, res) => {
  res.sendFile(__dirname + "/core//device.html");
});

app.get("/send", (req, res) => {
  res.sendFile(__dirname + "/core//send.html");
});

app.get("/send1", (req, res) => {
  res.sendFile(__dirname + "/core//send1.html");
});

app.get("/upload1", (req, res) => {
  res.sendFile(__dirname + "/core//upload1.html");
});

app.get("/scan/:id", (req, res) => {
  const no = req.params.id;
   res.sendFile(__dirname + "/core//index.html");
  connectToWhatsApp(no);
});

app.post('/upload', (req, res) => { 
  // Get the file that was set to our field named "image"
  const { image } = req.files;
console.log(image);
  // If no image submitted, exit
  if (!image) return res.sendStatus(400);

  // Move the uploaded image to our upload folder
  image.mv(__dirname + '/uploads/' + image.name);

  res.sendStatus(200);
 });

// send text message to wa user
// send text message to wa user
app.post("/send-message", async (req, res) =>{
  //console.log(req);
  const pesankirim = req.body.message;
  const number = req.body.number; 
 // const fileDikirim1 = req.files;
  //const { image } = req.files;
 // console.log(req.files);
 // console.log('number -'+number);
 // console.log('msg -'+pesankirim);
let numberWA;
  try {
      if(!req.files) 
      {
          if(!number) {
               res.status(500).json({
                  status: false,
                  response: 'The WA number has not been included!'
              });
          }
          else
          {          
              numberWA = '91'+number+"@s.whatsapp.net"; 
              console.log(await sock.onWhatsApp(numberWA));
              if (isConnected) {
                  const exists = await sock.onWhatsApp(numberWA);
                  if (exists?.jid || (exists && exists[0]?.jid)) {
                      sock.sendMessage(exists.jid || exists[0].jid, { text: pesankirim })
                      .then((result) => {
                          res.status(200).json({
                              status: true,
                              response: result,
                          });
                      })
                      .catch((err) => {
                          res.status(500).json({
                              status: false,
                              response: err,
                          });
                      });
                  } else {
                      res.status(500).json({
                          status: false,
                          response: `Whatsnot ${number} not listed.`,
                      });
                  }
              } else {
                  res.status(500).json({
                      status: false,
                      response: `WhatsApp is not yet connected.`,
                  });
              }    
          }
      }
      else
      {
         // console.log('Kirim document');
          if(!number) {
               res.status(500).json({
                  status: false,
                  response: 'The WA number has not been included!'
              });
          }
          else
          {
              
              numberWA = '91'+number+"@s.whatsapp.net"; 
            //  console.log('Kirim document ke'+ numberWA);
              const { image } = req.files;
             // let filesimpan = req.files.file_dikirim;
              var file_ubah_nama = new Date().getTime() +'_'+image.name;
              //pindahkan file ke dalam upload directory
              image.mv('./uploads/' + file_ubah_nama);
              let fileDikirim_Mime = image.mimetype;
              //console.log('Simpan document '+fileDikirim_Mime);

              //console.log(await sock.onWhatsApp(numberWA));

              if (isConnected) {
               
                let namafiledikirim = './uploads/' + file_ubah_nama;
                //  let extensionName = path.extname(namafiledikirim); 
                let ext = namafiledikirim
  .split('.')
  .filter(Boolean) // removes empty extensions (e.g. `filename...txt`)
  .slice(1)
  .join('.')            
                  const exists = await sock.onWhatsApp(numberWA);               
                  if (exists?.jid || (exists && exists[0]?.jid)) {
                      
                    console.log('path44- '+namafiledikirim);
                      if( ext === 'jpeg' || ext === 'jpg' || ext === 'png' || ext === 'gif' ) {
                           await sock.sendMessage(exists.jid || exists[0].jid, { 
                              image: {
                                  url: namafiledikirim
                              },
                              caption:pesankirim
                          }).then((result) => {
                              if (fs.existsSync(namafiledikirim)) {
                                  fs.unlink(namafiledikirim, (err) => {
                                      if (err && err.code == "ENOENT") {
                                          // file doens't exist
                                          console.info("File doesn't exist, won't remove it.");
                                      } else if (err) {
                                          console.error("Error occurred while trying to remove file.");
                                      }
                                      //console.log('File deleted!');
                                  });
                              }
                              res.send({
                                  status: true,
                                  message: 'Success',
                                  data: {
                                      name: image.name,
                                      mimetype: image.mimetype,
                                      size: image.size
                                  }
                              });
                          }).catch((err) => {
                              res.status(500).json({
                                  status: false,
                                  response: err,
                              });
                              console.log('message failed to send');
                          });
                      }else if(ext === 'mp3' || ext === 'ogg'  ) {
                          await sock.sendMessage(exists.jid || exists[0].jid, { 
                             audio: { 
                                  url: namafiledikirim,
                                  caption: pesankirim 
                              }, 
                              mimetype: 'audio/mp4'
                          }).then((result) => {
                              if (fs.existsSync(namafiledikirim)) {
                                  fs.unlink(namafiledikirim, (err) => {
                                      if (err && err.code == "ENOENT") {
                                          // file doens't exist
                                          console.info("File doesn't exist, won't remove it.");
                                      } else if (err) {
                                          console.error("Error occurred while trying to remove file.");
                                      }
                                      //console.log('File deleted!');
                                  });
                              }
                              res.send({
                                  status: true,
                                  message: 'Success',
                                  data: {
                                      name: image.name,
                                      mimetype: image.mimetype,
                                      size: image.size
                                  }
                              });
                          }).catch((err) => {
                              res.status(500).json({
                                  status: false,
                                  response: err,
                              });
                              console.log('message failed to send');
                          });
                      }else {
                          await sock.sendMessage(exists.jid || exists[0].jid, {
                              document: { 
                                  url:  namafiledikirim,
                                  caption: pesankirim 
                              }, 
                              mimetype: image.mimetype,
                              fileName: image.name
                          }).then((result) => {
                              if (fs.existsSync(namafiledikirim)) {
                                  fs.unlink(namafiledikirim, (err) => {
                                      if (err && err.code == "ENOENT") {
                                          // file doens't exist
                                          console.info("File doesn't exist, won't remove it.");
                                      } else if (err) {
                                          console.error("Error occurred while trying to remove file.");
                                      }
                                      //console.log('File deleted!');
                                  });
                              }
                              /*
              setTimeout(() => {
                                  sock.sendMessage(exists.jid || exists[0].jid, {text: pesankirim});
                              }, 1000);
              */
                              res.send({
                                  status: true,
                                  message: 'Success',
                                  data: {
                                      name: image.name,
                                      mimetype: image.mimetype,
                                      size: image.size
                                  }
                              });
                          }).catch((err) => {
                              res.status(500).json({
                                  status: false,
                                  response: err,
                              });
                              console.log('message failed to send');
                          });
                      }
                  } else {
                    console.log('else error');
                      res.status(500).json({
                          status: false,
                          response: `Please enter ${number} valid number.`,
                      });
                  }

              } else {
                  res.status(500).json({
                      status: false,
                      response: `WhatsApp is not yet connected.`,
                  });
              } 

          }
      }
  } catch (err) {
      res.status(500).send(err);
  }
  
});

app.post(
  "/send",
  [
    body("number").notEmpty(),
    body("message").notEmpty(),
    body("to").notEmpty(),
    body("type").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    } else {
      var number = req.body.number;
      var to1 = req.body.to;
      var type = req.body.type;
     var msg = req.body.message;
     //connectToWhatsApp(number);
    let numberWA;
    numberWA = '91' + to1 + "@s.whatsapp.net"; 
    console.log(await sock.onWhatsApp(numberWA));
    
        const exists = await sock.onWhatsApp(numberWA);
        if (exists?.jid || (exists && exists[0]?.jid)) {
            sock.sendMessage(exists.jid || exists[0].jid, { text: msg })
            .then((result) => {
                res.status(200).json({
                    status: true,
                    response: result,
                });
            })
            .catch((err) => {
                res.status(500).json({
                    status: false,
                    response: err,
                });
            });
        } 
     else {
        res.status(500).json({
            status: false,
            response: `This No is not on whatsapp.`,
        });
    }    
  }
   // var to =[919001480042];
   // var number='917014518593';
  //  var type = 'chat';
   // var msg='hello iff';
        var string = to1;
        var to = string.split(",");
        let length =  to.length;
/*
      if (fs.existsSync(path.concat(number) + ".json")) {
        if (Array.isArray(to)) {
          try {
            for (let x in to) {
              if (to[x].length < 12) {
                
                throw "value number invalid, must be greater than 12 "+to[x]+"digit";
                
              }
            }
         
            con.gas(msg, number, to, type)
          //  var query = con.gas(msg, number, to, type);       

            res.writeHead(200, {
              "Content-Type": "application/json",
            });      
              
                res.end(
                  JSON.stringify({
                    status: true,
                    message: "success - "+to+" Total Number- "+length,
                  })
                  
                );        
                
               // console.log(con.gas(msg, number, to, type));
          } catch (error) {
            res.writeHead(401, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                status: false,
                message: "This Number Not On Whatsapp - "+to+" error- "+error,
              })
            );
          }
        } else {
          res.writeHead(401, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              status: false,
              message: "input type to is not array value "+to+" Total Number- "+length,
            })
          );
        }
      } else {
        res.writeHead(401, {
          "Content-Type": "application/json",
        });
        res.end(
          JSON.stringify({
            status: false,
            message: "Please scan the QR before use the API",
          })
        );
      }*/
    }
  
);

app.post("/device", (req, res) => {
  const no = req.body.device;
  res.redirect("/scan/" + no);
  connectToWhatsApp(no);
});
//var no='917665914233';
//connectToWhatsApp(no);
server.listen(port, function () {
  console.log("App running on : " + port);
});
