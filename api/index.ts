import app from '../server.js';
import { globalStorageAdapter } from '../src/server/storage/storageAdapter.js';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await globalStorageAdapter.init();
    initialized = true;
  }
  return app(req, res);
}
