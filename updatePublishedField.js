import dotenv from 'dotenv';
dotenv.config({ path: './onlineadmin/.env.local' });
import { MongoClient } from 'mongodb';

console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debug print

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined. Please check your .env.local file and path.');
    process.exit(1);
  }
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db();
    const result = await db.collection('questions').updateMany(
      { published: { $exists: false } },
      { $set: { published: false } }
    );
    console.log(`Updated ${result.modifiedCount} questions.`);
  } catch (err) {
    console.error('Error updating questions:', err);
  } finally {
    await client.close();
  }
}

main();
