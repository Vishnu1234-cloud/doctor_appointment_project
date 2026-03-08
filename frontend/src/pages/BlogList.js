import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BlogList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/blog`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch blog posts');
    }
  };

  return (
    <div className="min-h-screen bg-accent/30" data-testid="blog-list-page">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm" data-testid="back-button">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="blog-title">Health Blog</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground" data-testid="no-posts">No blog posts yet</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Card
                key={post.id}
                className="rounded-3xl border-none shadow-lg cursor-pointer hover:shadow-xl"
                onClick={() => navigate(`/blog/${post.slug}`)}
                data-testid={`blog-post-${index}`}
              >
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t-3xl"
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-serif font-bold mb-2" data-testid={`post-title-${index}`}>{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    By {post.author} • {new Date(post.published_at).toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground line-clamp-3">{post.content.substring(0, 150)}...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}