import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { configureCloudinary } from './config/cloudinary';

const PORT = Number(process.env.PORT) || 5000;
// 0.0.0.0 makes the server reachable from the Android emulator and from phones on the same Wi-Fi.
const HOST = '0.0.0.0';

async function start() {
  const { MONGODB_URI, JWT_SECRET } = process.env;
  if (!MONGODB_URI || !JWT_SECRET) {
    console.error('MONGODB_URI and JWT_SECRET must be set in backend/.env (see .env.example)');
    process.exit(1);
  }

  configureCloudinary();

  try {
    await connectDatabase(MONGODB_URI);
  } catch (error) {
    console.error('Could not connect to MongoDB. Check MONGODB_URI and your Atlas network access list.');
    console.error((error as Error).message);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`LostLink API running on http://${HOST}:${PORT}  (health: /api/health)`);
  });
}

start();
