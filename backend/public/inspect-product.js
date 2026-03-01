require("dotenv").config();
const mongoose = require("mongoose");

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  // Find all products with old cloud name
  const products = await db.collection("products").find({}).toArray();
  
  console.log("Total products:", products.length);
  
  const oldCloudName = "dzngjsqpe";
  const newCloudName = "dnmpxo7ya";
  
  let count = 0;
  products.forEach((product, index) => {
    if (product.image && product.image.includes(oldCloudName)) {
      count++;
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Image: ${product.image}`);
      console.log(`   Should be: ${product.image.replace(oldCloudName, newCloudName)}`);
    }
    
    // Check additionalMedia
    if (product.additionalMedia && product.additionalMedia.length > 0) {
      product.additionalMedia.forEach((media, mediaIndex) => {
        if (media.includes(oldCloudName)) {
          count++;
          console.log(`${index + 1}. ${product.name} - Additional Media #${mediaIndex + 1}`);
          console.log(`   ${media}`);
        }
      });
    }
  });
  
  console.log(`\nTotal images using old cloud name: ${count}`);
  
  process.exit();
}

inspect();