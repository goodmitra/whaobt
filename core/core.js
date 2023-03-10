const {  default: makeWASocket,  DisconnectReason,  useSingleFileAuthState,MessageType, MessageOptions, Mimetype
} = require("@adiwajshing/baileys");
//const imageThumbnail = require('image-thumbnail');
const pino = require("pino");
const fs = require("fs");
const { Console } = require("console");
const path = "./core/";
let x;
let alert = require('alert'); 

const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
io.on("connection", function (socket) {
  console.log("Made socket connection");
  socket.emit('message', 'Test response sent') 
});

exports.gas = function (msg, no, to, type) {
  const numb = no + ".json"; 
 connect(numb, msg, to, type);  
 // console.log(JSON.stringify(uu));
};

async function connect(sta, msg, to, type) {
  const { state, saveState } = useSingleFileAuthState(path.concat(sta));
  
  const sock = makeWASocket({
    auth: state,
    defaultQueryTimeoutMs: undefined,
    logger: pino({ level: "fatal" }),
    browser: ["FFA", "EDGE", "1.0"],
  });
let retdatan;
let retdatan1;
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;



    if (connection == "connecting") return;

    if (connection === "close") {
      let statusCode = lastDisconnect.error?.output?.statusCode;

      if (statusCode === DisconnectReason.restartRequired) {
        return;
      } else if (statusCode === DisconnectReason.loggedOut) {
        if (fs.existsSync(path.concat(sta))) {
          fs.unlinkSync(path.concat(sta));
        }
        return;
      }
    } else if (connection === "open") {
      if (msg != null && to != null) {
     
        for (let x in to) {
         const id = to[x] + "@s.whatsapp.net";

      
       
          if (type === "chat") {              
            // sock.sendMessage(id, { text: msg, });            
            const exists = await sock.onWhatsApp(id);
            if (exists?.jid || (exists && exists[0]?.jid)) {
            //  sock.sendMessage(exists.jid || exists[0].jid, { text: msg }) 
           // const status = await sock.fetchStatus(exists[0]?.jid)
          // const ppUrl = await sock.profilePictureUrl(exists[0]?.jid, 'image')       
               
              console.log('This No is on Whatsapp -')   
              var jj=id;  
              io.emit("message", id);
              //console.log(JSON.stringify(sock));
          } 
          else{
            console.log('This No is Not on Whatsapp -'+id)  
          }
             
          }

          if(type === "buttonMessage")
          {
            const exists = await sock.onWhatsApp(id);
            if (exists?.jid || (exists && exists[0]?.jid)) {
            const templateButtons  = [
              {index: 1, urlButton: {displayText: '⭐ CLick Me!', url: 'http://online.gpsggc.com/'}},
             // {index: 2, callButton: {displayText: 'Call me!', phoneNumber: '09461334738'}},
            //  {index: 3, quickReplyButton: {displayText: 'Thank You!', id: 'ok'}}
            ]
            const buttonMessage = {
              image: {url: './upload/gpsiit.jpg'},
              caption: msg,
              footer: 'via GPS Cloud',
              templateButtons: templateButtons            
          }
                         
                await sock.sendMessage(exists.jid || exists[0].jid, buttonMessage) 
              } 
              else{
                console.log('This No is Not on Whatsapp -'+id)  
              }
          }
         
    /*
          if (type === "image") { 

    const result = await sock.onWhatsApp(id);
  if(result.length>0){     
      if (result[0].exists === true) {  
    console.log(JSON.stringify(result));
    console.log('This No is on Whatsapp');
    var iko='./upload/gpsiit.jpg';
    const myArray = msg.split("|"); 
    var buffer = Buffer.from(iko);
    var bitmap = buffer.toString('base64');
    
    // convert binary data to base64 encoded string   
  //  alert(hh);
  //  console.log(hh);
    const sendMsg  = await sock.sendMessage(id, {    
          
       image: {url: iko},
       caption: myArray[1]         
      
   });
   //console.log(sendMsg); 
//   image: buffer
 //  jpegThumbnail: buffer.toString('base64')
     retdatan="1";
     retdatan1="ok1";   
  }
  else{
    console.log(id+' Not exists on WhatsApp');
   
  }
}
else
{ console.log(JSON.stringify(result));
  console.log('Sorry This No is Not Whatsapp');  
  retdatan="2";
  retdatan1="no1";
}
        
        }*/

if (type === "video") { 
  const myArray = msg.split("|");
  await sock.sendMessage(
    id, 
    { 
       // video: "./upload/gtest.mp4", 
     //  video: fs.readFileSync("./upload/ght.mp4"),
     //  video: fs.readFileSync(myArray[0]),
        video: {url: "./upload/ght.mp4"},
        caption: myArray[1],
        //jpegThumbnail: fs.readFileSync("./upload/gtest.mp4")
    }
)
}

if (type === "image") { 
  const myArray = msg.split("|");
  var buffer = fs.readFileSync("./upload/gpsiit.jpg");
  var bitmap = buffer.toString('base64');
  await sock.sendMessage(
    id, 
    { 
       // video: "./upload/gtest.mp4", 
       // video: {url: './upload/gtest.mp4'},
        image: {url: myArray[0]},
        caption: myArray[1],
        jpegThumbnail: bitmap
    }
)

console.log(bitmap);
}

          //msg end
         /* 
         
            if (type === "chat") {
              
             sock.sendMessage(id, {
              text: msg,
            });
          }
         
          if (type === "image") { 
              const myArray = msg.split("|");
             sock.sendMessage(id, {
             // text: msg,
                image: {url: myArray[0]},
                caption: myArray[1],
               // gifPlayback: true
                 jpegThumbnail: true
                // originalThumbnailUrl: myArray[0]
               // jpegThumbnail = data.toString('base64');
                
            });
          }
          //ing end
          
          if (type === "document") { 
            const myArray = msg.split("|");
           sock.sendMessage(id, {          
              document: {url: myArray[0]},              
              caption: myArray[1]
          });
          
          }
          */
         //doc end 
         
        }
      }
    }
  });

  sock.ev.on("creds.update", saveState);
  return sock;
  
}
