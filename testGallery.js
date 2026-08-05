import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gallery from './models/Gallery.js';

dotenv.config();

const testGallery = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Test creating a gallery item
    const testItem = new Gallery({
      title: 'Test Image',
      description: 'This is a test gallery item',
      category: 'Test',
      mediaType: 'image',
      mediaUrl: 'https://via.placeholder.com/300',
      isUrl: true,
    });

    await testItem.save();
    console.log('✅ Test gallery item created successfully');

    // Count items
    const count = await Gallery.countDocuments();
    console.log(`📊 Total gallery items: ${count}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testGallery();