import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import * as articleController from '../controllers/articleController.js';

const articleRoutes = Router();

// Public Category Routes
articleRoutes.get('/categories', articleController.getCategories);

// Public Article Routes
articleRoutes.get('/', articleController.publicGetArticles);
articleRoutes.get('/slug/:slug', articleController.publicGetArticleBySlug);

// Authenticated Category Follows Routes
articleRoutes.get('/categories/follows', requireAuth, articleController.getFollowedCategories);
articleRoutes.post('/categories/:categoryId/follow', requireAuth, articleController.followCategory);
articleRoutes.post('/categories/:categoryId/unfollow', requireAuth, articleController.unfollowCategory);

// Authenticated Contributor/Admin Article Routes
articleRoutes.get('/my', requireAuth, articleController.contributorGetArticles);
articleRoutes.post('/', requireAuth, articleController.contributorCreateArticle);
articleRoutes.put('/:id', requireAuth, articleController.contributorUpdateArticle);
articleRoutes.delete('/:id', requireAuth, articleController.deleteArticle);
articleRoutes.post('/:id/submit', requireAuth, articleController.contributorSubmitForReview);

// Admin-only Routes
articleRoutes.get('/admin', requireAuth, articleController.adminGetArticles);
articleRoutes.post('/admin/:id/review', requireAuth, articleController.adminReviewArticle);

// Notification Routes
articleRoutes.get('/notifications/my', requireAuth, articleController.getUserNotifications);
articleRoutes.post('/notifications/:id/read', requireAuth, articleController.markNotificationRead);

export default articleRoutes;
