import BlogPost from '../models/BlogPost.js';

class BlogController {
  // Get all blog posts
  async getPosts(req, res, next) {
    try {
      const posts = await BlogPost.find().sort({ published_at: -1 }).limit(100);

      res.json(posts.map((p) => p.toObject()));
    } catch (error) {
      next(error);
    }
  }

  // Get single blog post by slug
  async getPostBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const post = await BlogPost.findOne({ slug });

      if (!post) {
        return res.status(404).json({ detail: 'Blog post not found' });
      }

      res.json(post.toObject());
    } catch (error) {
      next(error);
    }
  }
}

export default new BlogController();
