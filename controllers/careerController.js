import Career from '../models/Career.js';

export const createCareer = async (req, res) => {
  try {
    const career = new Career(req.body);
    await career.save();
    res.status(201).json(career);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCareers = async (req, res) => {
  try {
    const careers = await Career.find({ isActive: true }).sort({ postedDate: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ postedDate: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }
    res.json(career);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }
    res.json(career);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCareer = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }
    await career.deleteOne();
    res.json({ message: 'Career deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};