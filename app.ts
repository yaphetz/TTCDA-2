import express from 'express';
import fs from 'fs';
import cors from 'cors'
import { WebSocketServer } from 'ws';

const app = express();
const port = 3000; // Choose a port for your server
const wss = new WebSocketServer({ port: 8081 })

app.use(cors());

wss.on('connection', ws => {
  console.log('WebSocked connected')
  let audioStream : any;
  

  ws.on('message', message => {
    const songName = message.toString().split("#", 2).slice(1).join("-").split('"')[0];
    console.log(songName)
    if (message.toString().includes('start')) {
      const audioFile = `songs/${songName}`;
      audioStream = fs.createReadStream(audioFile);
      console.log('Audio streaming started');

      audioStream.on('data', (chunk: string | number | readonly any[] | Buffer | ArrayBuffer | Uint8Array | DataView | ArrayBufferView | SharedArrayBuffer | readonly number[] | { valueOf(): ArrayBuffer; } | { valueOf(): SharedArrayBuffer; } | { valueOf(): Uint8Array; } | { valueOf(): readonly number[]; } | { valueOf(): string; } | { [Symbol.toPrimitive](hint: string): string; }) => {
        // Send each chunk of audio data
        ws.send(chunk);
      });

      audioStream.on('end', () => {
        // Audio stream ended, close the WebSocket
        ws.send('Audio stream ended');
        ws.close();
      });
    }
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
    if (audioStream) {
      audioStream.close(); // Close the audio stream when WebSocket is closed
    }
  });
});

app.get('/songs', (req: any, res: any) => {
  fs.readdir('songs', (error: any, files: any[]) => {
    res.send(files);
  });
})

app.get('/stream_audio/:name', (req: any, res: any) => {
  const song = req.params.name;

  const audioFile = `songs/${song}`;
  const audioStream = fs.createReadStream(audioFile);

  res.setHeader('Content-Type', 'audio/mpeg');
  audioStream.pipe(res);

  audioStream.on('error', (err) => {
    console.error('Error streaming audio:', err);
    res.status(500).end('Error streaming audio');
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
