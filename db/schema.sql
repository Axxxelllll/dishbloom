-- Recipes (the core)
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  quick_summary TEXT,
  cuisine TEXT,
  difficulty TEXT DEFAULT 'easy',
  prep_time INTEGER DEFAULT 0,
  cook_time INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 4,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  fiber INTEGER,
  ingredients TEXT NOT NULL,
  steps TEXT NOT NULL,
  substitutions TEXT,
  common_mistakes TEXT,
  tags TEXT,
  dietary TEXT,
  category TEXT,
  hero_image TEXT,
  step_images TEXT,
  source TEXT DEFAULT 'ai',
  author_id INTEGER,
  is_featured INTEGER DEFAULT 0,
  is_dish_of_week INTEGER DEFAULT 0,
  is_sponsored INTEGER DEFAULT 0,
  sponsor_name TEXT,
  total_saves INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  avg_rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_premium INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  recipes_uploaded INTEGER DEFAULT 0,
  total_saves_received INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Collections (Pinterest boards)
CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_public INTEGER DEFAULT 1,
  recipe_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Saved recipes (which recipe in which collection)
CREATE TABLE collection_recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  UNIQUE(collection_id, recipe_id)
);

-- Reviews & ratings
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(recipe_id, user_id)
);

-- "I made this" photos
CREATE TABLE made_this (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Follows (user follows user or cuisine)
CREATE TABLE follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL,
  following_id INTEGER,
  cuisine TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

-- Challenges
CREATE TABLE challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  start_date TEXT,
  end_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Challenge entries
CREATE TABLE challenge_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  recipe_id INTEGER,
  photo_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Polls
CREATE TABLE polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  votes_a INTEGER DEFAULT 0,
  votes_b INTEGER DEFAULT 0,
  ends_at TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Poll votes (prevent double voting)
CREATE TABLE poll_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  choice TEXT NOT NULL CHECK(choice IN ('a', 'b')),
  FOREIGN KEY (poll_id) REFERENCES polls(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(poll_id, user_id)
);

-- Page views (analytics)
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  recipe_id INTEGER,
  referrer TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Grocery lists
CREATE TABLE grocery_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT DEFAULT 'My list',
  items TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Meal planner
CREATE TABLE meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  week_start TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for speed
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX idx_recipes_dietary ON recipes(dietary);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_featured ON recipes(is_featured);
CREATE INDEX idx_recipes_rating ON recipes(avg_rating DESC);
CREATE INDEX idx_recipes_views ON recipes(total_views DESC);
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_reviews_recipe ON reviews(recipe_id);
CREATE INDEX idx_made_this_recipe ON made_this(recipe_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_page_views_path ON page_views(path);
