const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = "mongodb+srv://enejorboy:dWucSf0mjitLkO3y@cluster0.7euceow.mongodb.net/cbt?retryWrites=true&w=majority";
  
  try {
    const client = new MongoClient(uri);
    console.log("Connecting to MongoDB...");
    
    await client.connect();
    console.log("✅ Connected successfully!");
    
    // Test listing databases
    const databases = await client.db().admin().listDatabases();
    console.log("Databases:", databases.databases.map(db => db.name));
    
    await client.close();
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testConnection();