import makeWASocket, { useSingleFileAuthState } from '@adiwajshing/baileys';
import express from 'express';
import QRCode from 'qrcode';
import fs from 'fs';

const app = express();
app.use(express.json());

const { state, saveState } = useSingleFileAuthState('./auth_info.json');
let sock;

app.post('/start-session', async (req, res) => {
  sock = makeWASocket({ auth: state });

  sock.ev.on('creds.update', saveState);
  sock.ev.on('connection.update', async (update) => {
    if(update.qr) {
      const qrData = await QRCode.toDataURL(update.qr);
      const base64 = qrData.split(',')[1]; // just the base64
      res.json({ qr: base64 });
    }
  });
});

app.get('/check-session', (req, res) => {
  const connected = sock && sock.user ? true : false;
  res.json({ connected });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
