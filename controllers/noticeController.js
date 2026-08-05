import Notice from '../models/Notice.js';

export const createNotice = async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const notice = new Notice({ title, content, priority });
    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, content, priority },
      { new: true }
    );
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    await notice.deleteOne();
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};