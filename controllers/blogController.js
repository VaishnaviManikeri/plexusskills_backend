import Blog from '../models/Blog.js';
import cloudinary from '../config/cloudinary.js';

export const createBlog = async (req, res) => {
  try {
    const { title, content, author, metaTitle, metaDescription, tags } = req.body;
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Calculate reading time (approx 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const blog = new Blog({
      title,
      slug,
      content,
      author,
      imageUrl,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.substring(0, 160),
      readingTime,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    blog.views += 1;
    await blog.save();
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { title, content, author, metaTitle, metaDescription, tags } = req.body;
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      blog.imageUrl = result.secure_url;
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.author = author || blog.author;
    blog.metaTitle = metaTitle || blog.metaTitle;
    blog.metaDescription = metaDescription || blog.metaDescription;
    blog.tags = tags ? tags.split(',').map(t => t.trim()) : blog.tags;

    if (title && title !== blog.title) {
      blog.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    await blog.deleteOne();
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};