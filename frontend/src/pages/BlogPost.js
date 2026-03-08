import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API}/blog/${slug}`);
      setPost(response.data);
    } catch (error) {
      console.error('Failed to fetch blog post');
    }
  };

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center" data-testid="loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-accent/30" data-testid="blog-post-page">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button onClick={() => navigate('/blog')} variant="ghost" size="sm" data-testid="back-button">
            <ArrowLeft size={20} className="mr-2" /> Back to Blog
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="rounded-3xl border-none shadow-lg" data-testid="blog-post-card">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-96 object-cover rounded-t-3xl"
            data-testid="post-image"
          />
          <CardContent className="p-12">
            <h1 className="text-5xl font-serif font-bold mb-4" data-testid="post-title">{post.title}</h1>
            <p className="text-muted-foreground mb-8" data-testid="post-meta">
              By {post.author} • {new Date(post.published_at).toLocaleDateString()}
            </p>
            <div className="prose max-w-none text-muted-foreground leading-relaxed" data-testid="post-content">
              {post.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}