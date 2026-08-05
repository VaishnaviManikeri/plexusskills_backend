import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [String],
  location: String,
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract'],
    required: true,
  },
  salary: String,
  postedDate: {
    type: Date,
    default: Date.now,
  },
  applicationDeadline: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model('Career', careerSchema);