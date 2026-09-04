import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import * as articleModel from '../models/articleModel.js';

// Helper to generate slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// -------------------------------------------------------------
// Category Handlers
// -------------------------------------------------------------

export async function getCategories(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const list = await articleModel.listCategories();
    response.json({ categories: list });
  } catch (error) {
    next(error);
  }
}

export async function getFollowedCategories(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    const follows = await articleModel.getFollowedCategories(request.auth.userId);
    response.json({ follows });
  } catch (error) {
    next(error);
  }
}

export async function followCategory(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const categoryId = request.params.categoryId;
  if (typeof categoryId !== 'string') {
    response.status(400).json({ error: 'Category ID must be a string.' });
    return;
  }
  try {
    await articleModel.followCategory(request.auth.userId, categoryId);
    response.status(200).json({ message: 'Category followed successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function unfollowCategory(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const categoryId = request.params.categoryId;
  if (typeof categoryId !== 'string') {
    response.status(400).json({ error: 'Category ID must be a string.' });
    return;
  }
  try {
    await articleModel.unfollowCategory(request.auth.userId, categoryId);
    response.status(200).json({ message: 'Category unfollowed successfully.' });
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// Public Article Handlers
// -------------------------------------------------------------

export async function publicGetArticles(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const { search, category_id } = request.query;
  try {
    const params: { search?: string; category_id?: string } = {};
    if (typeof search === 'string') params.search = search;
    if (typeof category_id === 'string') params.category_id = category_id;

    const articles = await articleModel.listPublishedArticles(params);
    response.json({ articles });
  } catch (error) {
    next(error);
  }
}

export async function publicGetArticleBySlug(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const slug = request.params.slug;
  if (typeof slug !== 'string') {
    response.status(400).json({ error: 'Slug must be a string.' });
    return;
  }
  try {
    const article = await articleModel.getArticleBySlug(slug);
    if (!article) {
      response.status(404).json({ error: 'Article not found.' });
      return;
    }
    response.json({ article });
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// Contributor Handlers
// -------------------------------------------------------------

export async function contributorGetArticles(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    const articles = await articleModel.listArticlesByAuthor(request.auth.userId);
    response.json({ articles });
  } catch (error) {
    next(error);
  }
}

export async function contributorCreateArticle(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const { title, description, content, category_id, cover_image, status } = request.body;
  if (!title || !description || !content || !category_id) {
    response.status(400).json({ error: 'Title, description, content, and category_id are required.' });
    return;
  }

  try {
    // Basic slug generation
    const baseSlug = slugify(title);
    // Add unique hash to prevent duplicate slug clashes
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substr(2, 6)}`;

    // Contributor status checks
    const targetStatus = request.auth.role === 'admin' ? (status || 'draft') : 'draft';

    const article = await articleModel.createArticle({
      title,
      slug: uniqueSlug,
      description,
      content,
      category_id,
      author_id: request.auth.userId,
      cover_image,
      status: targetStatus,
    });
    response.status(201).json({ article });
  } catch (error) {
    next(error);
  }
}

export async function contributorUpdateArticle(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const id = request.params.id;
  if (typeof id !== 'string') {
    response.status(400).json({ error: 'ID must be a string.' });
    return;
  }
  const { title, description, content, category_id, cover_image } = request.body;

  try {
    const existing = await articleModel.getArticleById(id);
    if (!existing) {
      response.status(404).json({ error: 'Article not found.' });
      return;
    }

    // Role check: Only author or admin can edit
    if (existing.author_id !== request.auth.userId && request.auth.role !== 'admin') {
      response.status(403).json({ error: 'Permission denied.' });
      return;
    }

    // Status check: Contributor can only edit draft or rejected articles
    if (request.auth.role !== 'admin' && existing.status !== 'draft' && existing.status !== 'rejected') {
      response.status(400).json({ error: 'Only drafts or rejected articles can be modified.' });
      return;
    }

    const updated = await articleModel.updateArticle(id, {
      title: title || existing.title,
      slug: title ? slugify(title) + '-' + existing.slug.split('-').pop() : existing.slug,
      description: description || existing.description,
      content: content || existing.content,
      category_id: category_id || existing.category_id,
      cover_image: cover_image !== undefined ? cover_image : existing.cover_image,
      status: existing.status === 'rejected' ? 'draft' : existing.status, // Back to draft if modified from rejected
    });

    response.json({ article: updated });
  } catch (error) {
    next(error);
  }
}

export async function contributorSubmitForReview(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const id = request.params.id;
  if (typeof id !== 'string') {
    response.status(400).json({ error: 'ID must be a string.' });
    return;
  }
  try {
    const existing = await articleModel.getArticleById(id);
    if (!existing) {
      response.status(404).json({ error: 'Article not found.' });
      return;
    }
    if (existing.author_id !== request.auth.userId && request.auth.role !== 'admin') {
      response.status(403).json({ error: 'Permission denied.' });
      return;
    }

    const updated = await articleModel.updateArticle(id, {
      title: existing.title,
      slug: existing.slug,
      description: existing.description,
      content: existing.content,
      category_id: existing.category_id,
      cover_image: existing.cover_image,
      status: 'pending_review',
    });
    response.json({ article: updated });
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// Admin Handlers
// -------------------------------------------------------------

export async function adminGetArticles(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth || request.auth.role !== 'admin') {
    response.status(403).json({ error: 'Admin access required.' });
    return;
  }
  try {
    const articles = await articleModel.listAllArticlesForAdmin();
    response.json({ articles });
  } catch (error) {
    next(error);
  }
}

export async function adminReviewArticle(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth || request.auth.role !== 'admin') {
    response.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const id = request.params.id;
  if (typeof id !== 'string') {
    response.status(400).json({ error: 'ID must be a string.' });
    return;
  }
  const { decision, reason } = request.body; // decision: 'approve' or 'reject'

  if (decision !== 'approve' && decision !== 'reject') {
    response.status(400).json({ error: 'Invalid decision. Must be approve or reject.' });
    return;
  }

  try {
    const targetStatus = decision === 'approve' ? 'published' : 'draft';
    const rejectionReason = decision === 'reject' ? (reason || 'No details provided.') : null;

    const updated = await articleModel.reviewArticle(id, targetStatus, rejectionReason);
    if (!updated) {
      response.status(404).json({ error: 'Article not found.' });
      return;
    }
    response.json({ article: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteArticle(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const id = request.params.id;
  if (typeof id !== 'string') {
    response.status(400).json({ error: 'ID must be a string.' });
    return;
  }
  try {
    const existing = await articleModel.getArticleById(id);
    if (!existing) {
      response.status(404).json({ error: 'Article not found.' });
      return;
    }
    if (existing.author_id !== request.auth.userId && request.auth.role !== 'admin') {
      response.status(403).json({ error: 'Permission denied.' });
      return;
    }
    await articleModel.deleteArticle(id);
    response.status(200).json({ message: 'Article deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// In-App Notification Handlers
// -------------------------------------------------------------

export async function getUserNotifications(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    const notifications = await articleModel.listNotificationsByUser(request.auth.userId);
    response.json({ notifications });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const id = request.params.id;
  if (typeof id !== 'string') {
    response.status(400).json({ error: 'ID must be a string.' });
    return;
  }
  try {
    const success = await articleModel.markNotificationAsRead(id, request.auth.userId);
    if (!success) {
      response.status(404).json({ error: 'Notification not found or access denied.' });
      return;
    }
    response.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}
