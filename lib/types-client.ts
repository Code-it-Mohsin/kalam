export interface User {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  createdAt?: string;
}

export interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content?: string;
  coverImage?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  author: {
    username: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    name: string | null;
    image: string | null;
  };
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface PaginatedBlogs {
  blogs: Blog[];
  nextCursor: string | null;
}