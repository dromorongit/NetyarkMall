require('dotenv').config();
const mongoose = require('mongoose');

// Constants for cloud names
const OLD_CLOUD_NAME = 'dzngjsqpe';
const NEW_CLOUD_NAME = 'dnmpxo7ya';

async function fixCloudinaryUrls() {
  try {
    // Connect to MongoDB using MONGO_URI from .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Use aggregation pipeline with $replaceOne to update image URLs
    const result = await productsCollection.updateMany(
      { image: { $regex: OLD_CLOUD_NAME, $options: 'i' } },
      [
        {
          $set: {
            image: {
              $replaceOne: {
                input: '$image',
                find: OLD_CLOUD_NAME,
                replacement: NEW_CLOUD_NAME
              }
            }
          }
        }
      ]
    );

    console.log(`Number of documents modified: ${result.modifiedCount}`);
    console.log('Cloudinary URL fix completed successfully');

    // Also update additionalMedia array if it contains the old cloud name
    const additionalMediaResult = await productsCollection.updateMany(
      { additionalMedia: { $elemMatch: { $regex: OLD_CLOUD_NAME, $options: 'i' } } },
      [
        {
          $set: {
            additionalMedia: {
              $map: {
                input: '$additionalMedia',
                as: 'media',
                in: {
                  $replaceOne: {
                    input: '$$media',
                    find: OLD_CLOUD_NAME,
                    replacement: NEW_CLOUD_NAME
                  }
                }
              }
            }
          }
        }
      ]
    );

    if (additionalMediaResult.modifiedCount > 0) {
      console.log(`Additional media documents modified: ${additionalMediaResult.modifiedCount}`);
    }

    console.log('All Cloudinary URLs have been updated');
    console.log(`Replaced ${OLD_CLOUD_NAME} with ${NEW_CLOUD_NAME}`);

  } catch (error) {
    console.error('Error fixing Cloudinary URLs:', error.message);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the fix
fixCloudinaryUrls();
