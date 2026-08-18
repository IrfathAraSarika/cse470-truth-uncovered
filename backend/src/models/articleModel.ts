import { pool } from './database.js';

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface Article {
  article_id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  cover_image: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  article_id: string | null;
  type: string;
  channel: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// -------------------------------------------------------------
// Category Queries
// -------------------------------------------------------------

export async function listCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `select category_id, name, slug, is_active, created_at 
     from categories 
     where is_active = true 
     order by name asc`
  );
  return result.rows;
}

export async function followCategory(userId: string, categoryId: string): Promise<void> {
  await pool.query(
    `insert into category_follows (user_id, category_id) 
     values ($1, $2) 
     on conflict (user_id, category_id) do nothing`,
    [userId, categoryId]
  );
}

export async function unfollowCategory(userId: string, categoryId: string): Promise<void> {
  await pool.query(
    `delete from category_follows 
     where user_id = $1 and category_id = $2`,
    [userId, categoryId]
  );
}

export async function getFollowedCategories(userId: string): Promise<string[]> {
  const result = await pool.query<{ category_id: string }>(
    `select category_id from category_follows where user_id = $1`,
    [userId]
  );
  return result.rows.map(row => row.category_id);
}

// -------------------------------------------------------------
// Article Queries
// -------------------------------------------------------------

export async function createArticle(data: {
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  author_id: string;
  status?: string;
  cover_image?: string | null;
}): Promise<Article> {
  const result = await pool.query<Article>(
    `insert into articles (title, slug, description, content, category_id, author_id, status, cover_image)
     values ($1, $2, $3, $4, $5, $6, $7::content_status, $8)
     returning *`,
    [
      data.title,
      data.slug,
      data.description,
      data.content,
      data.category_id,
      data.author_id,
      data.status || 'draft',
      data.cover_image || null
    ]
  );
  const article = result.rows[0];
  if (!article) throw new Error('Failed to create article');
  return article;
}

export async function getArticleById(articleId: string): Promise<Article | null> {
  const result = await pool.query<Article>(
    `select a.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.role as author_role
     from articles a
     join categories c on c.category_id = a.category_id
     join app_users u on u.user_id = a.author_id
     where a.article_id = $1`,
    [articleId]
  );
  return result.rows[0] || null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const result = await pool.query<Article>(
    `select a.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.role as author_role
     from articles a
     join categories c on c.category_id = a.category_id
     join app_users u on u.user_id = a.author_id
     where a.slug = $1 and a.status = 'published'`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function updateArticle(
  articleId: string,
  data: {
    title: string;
    slug: string;
    description: string;
    content: string;
    category_id: string;
    status?: string;
    cover_image?: string | null;
  }
): Promise<Article | null> {
  const result = await pool.query<Article>(
    `update articles
     set title = $1,
         slug = $2,
         description = $3,
         content = $4,
         category_id = $5,
     status = coalesce($6::content_status, status),
         cover_image = $7,
         updated_at = now()
     where article_id = $8
     returning *`,
    [
      data.title,
      data.slug,
      data.description,
      data.content,
      data.category_id,
      data.status || null,
      data.cover_image || null,
      articleId
    ]
  );
  return result.rows[0] || null;
}

export async function deleteArticle(articleId: string): Promise<boolean> {
  const result = await pool.query(
    `delete from articles where article_id = $1 returning article_id`,
    [articleId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listPublishedArticles(params: {
  search?: string;
  category_id?: string;
}): Promise<Article[]> {
  let query = `
    select a.article_id, a.title, a.slug, a.description, a.category_id, a.cover_image, a.published_at, a.created_at,
           c.name as category_name, c.slug as category_slug, u.full_name as author_name
    from articles a
    join categories c on c.category_id = a.category_id
    join app_users u on u.user_id = a.author_id
    where a.status = 'published'
  `;
  const values: any[] = [];
  let index = 1;

  if (params.category_id) {
    query += ` and a.category_id = $${index++}`;
    values.push(params.category_id);
  }

  if (params.search) {
    query += ` and (a.title ilike $${index} or a.description ilike $${index} or a.content ilike $${index})`;
    values.push(`%${params.search}%`);
    index++;
  }

  query += ` order by a.published_at desc, a.created_at desc`;

  const result = await pool.query<Article>(query, values);
  return result.rows;
}

export async function listArticlesByAuthor(authorId: string): Promise<Article[]> {
  const result = await pool.query<Article>(
    `select a.*, c.name as category_name, c.slug as category_slug
     from articles a
     join categories c on c.category_id = a.category_id
     where a.author_id = $1
     order by a.created_at desc`,
    [authorId]
  );
  return result.rows;
}

export async function listAllArticlesForAdmin(): Promise<Article[]> {
  const result = await pool.query<Article>(
    `select a.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.role as author_role
     from articles a
     join categories c on c.category_id = a.category_id
     join app_users u on u.user_id = a.author_id
     order by case when a.status = 'pending_review' then 1 else 2 end, a.created_at desc`
  );
  return result.rows;
}

export async function reviewArticle(
  articleId: string,
  status: 'published' | 'draft',
  rejectionReason: string | null
): Promise<Article | null> {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const result = await client.query<Article>(
      `update articles
       set status = $1::content_status,
           rejection_reason = $2,
           published_at = case when $1 = 'published' then now() else published_at end,
           updated_at = now()
       where article_id = $3
       returning *`,
      [status, rejectionReason, articleId]
    );

    const article = result.rows[0];
    if (!article) {
      await client.query('rollback');
      return null;
    }

    // If published, send in-app notification to all users following this category
    if (status === 'published') {
      await client.query(
        `insert into notifications (user_id, article_id, type, channel, message, created_at)
         select cf.user_id, $1, 'blog_update'::notification_type, 'in_app'::notification_channel, $2, now()
         from category_follows cf
         where cf.category_id = $3`,
        [article.article_id, `New article published: "${article.title}"`, article.category_id]
      );
    }

    await client.query('commit');
    return article;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------
// In-App Notification Queries
// -------------------------------------------------------------

export async function listNotificationsByUser(userId: string): Promise<Notification[]> {
  const result = await pool.query<Notification>(
    `select notification_id, user_id, article_id, type, channel, message, is_read, created_at
     from notifications
     where user_id = $1 and channel = 'in_app'
     order by created_at desc
     limit 50`,
    [userId]
  );
  return result.rows;
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `update notifications
     set is_read = true
     where notification_id = $1 and user_id = $2
     returning notification_id`,
    [notificationId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
