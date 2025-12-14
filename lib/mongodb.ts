import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/site-scanner';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'site-scanner';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      // Connection options for production
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db(MONGODB_DB_NAME);

    // Create indexes for better query performance
    await createIndexes(db);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log('Connected to MongoDB successfully');
    return { client, db };

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw new Error('Failed to connect to database');
  }
}

async function createIndexes(db: Db): Promise<void> {
  try {
    // Index for scan queries by URL and status
    await db.collection('scans').createIndex({ target_url: 1, status: 1 });
    await db.collection('scans').createIndex({ scan_id: 1 }, { unique: true });
    await db.collection('scans').createIndex({ created_at: -1 });
    
    // Index for user scans (if we add user authentication later)
    // await db.collection('scans').createIndex({ user_id: 1, created_at: -1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Failed to create database indexes:', error);
    // Don't throw here, indexes might already exist
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('Disconnected from MongoDB');
  }
}
