import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: 'Dr. Annu Sharma',
    },
    published_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'blog_posts',
  }
);

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
