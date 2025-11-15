import express from 'express';
import makeWASocket, { useSingleFileAuthState } from '@adiwajshing/baileys';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static('public')); // serve frontend

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

let sock;

// Start session endpoint
app.post('/start-session', async (req, res) => {
  if(sock) sock.end(); // close previous socket
  sock = makeWASocket({ auth: state });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', async (update) => {
    if(update.qr) {
      const qrData = await QRCode.toDataURL(update.qr);
      const base64 = qrData.split(',')[1];
      res.json({ qr: base64 });
    } else if(update.connection === 'close') {
      sock = null;
    }
  });
});

// Check session status
app.get('/check-session', (req, res) => {
  const connected = sock && sock.user ? true : false;
  res.json({ connected });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
