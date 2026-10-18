import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  exam: text('exam').notNull(), // 'CS', 'DA'
  sectionNumber: integer('section_number').notNull(),
  description: text('description'),
});

export const topics = sqliteTable('topics', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'COMMON', 'CS_ONLY', 'DA_ONLY'
  sharedScope: text('shared_scope').notNull().default('STANDALONE'), // 'CORE_SHARED', 'CS_EXTENSION', 'DA_EXTENSION', 'STANDALONE'
  description: text('description'),
  orderIndex: integer('order_index').default(0),
});

export const subtopics = sqliteTable('subtopics', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'COMMON', 'CS_ONLY', 'DA_ONLY'
  canonicalId: text('canonical_id'), // For common topics shared across CS and DA
  orderIndex: integer('order_index').default(0),
});

export const subtopicProgress = sqliteTable('subtopic_progress', {
  subtopicId: text('subtopic_id').primaryKey(), // Uses canonicalId for shared items
  status: text('status').notNull().default('NOT_STARTED'), // 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
  theoryCompleted: integer('theory_completed').default(0),
  practiceCompleted: integer('practice_completed').default(0),
  pyqCompleted: integer('pyq_completed').default(0),
  revisionCompleted: integer('revision_completed').default(0),
  confidenceRating: integer('confidence_rating').default(0), // 1-5
  notes: text('notes'),
  mistakes: text('mistakes'),
  nextRevisionDate: text('next_revision_date'),
  lastStudiedAt: text('last_studied_at'),
  updatedAt: text('updated_at'),
});

// Legacy topic progress table retained for backward compatibility
export const topicProgress = sqliteTable('topic_progress', {
  topicId: text('topic_id').primaryKey(),
  status: text('status').notNull().default('NOT_STARTED'),
  theoryCompleted: integer('theory_completed').default(0),
  practiceCompleted: integer('practice_completed').default(0),
  pyqCompleted: integer('pyq_completed').default(0),
  revisionCompleted: integer('revision_completed').default(0),
  confidenceRating: integer('confidence_rating').default(0),
  notes: text('notes'),
  mistakes: text('mistakes'),
  nextRevisionDate: text('next_revision_date'),
  lastStudiedAt: text('last_studied_at'),
  updatedAt: text('updated_at'),
});

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  subtopicId: text('subtopic_id'),
  topicId: text('topic_id'),
  category: text('category').notNull(), // 'COMMON', 'CS_ONLY', 'DA_ONLY'
  activityType: text('activity_type').notNull(), // 'Concept Learning', 'Practice & PYQs', 'Revision'
  plannedMinutes: integer('planned_minutes').default(60),
  actualMinutes: integer('actual_minutes').default(0),
  sessionDate: text('session_date').notNull(), // YYYY-MM-DD
  completed: integer('completed').default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const dailyPlans = sqliteTable('daily_plans', {
  id: text('id').primaryKey(),
  planDate: text('plan_date').notNull(), // YYYY-MM-DD
  sessionNumber: integer('session_number').notNull(), // 1, 2, 3
  activity: text('activity').notNull(),
  plannedMinutes: integer('planned_minutes').default(60),
  actualMinutes: integer('actual_minutes').default(0),
  category: text('category').notNull(), // 'COMMON', 'CS', 'DA'
  subtopicId: text('subtopic_id'),
  topicId: text('topic_id'),
  completed: integer('completed').default(0),
  notes: text('notes'),
  updatedAt: text('updated_at'),
});

export const revisionRecords = sqliteTable('revision_records', {
  id: text('id').primaryKey(),
  subtopicId: text('subtopic_id').notNull(),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  completedDate: text('completed_date'),
  status: text('status').notNull().default('SCHEDULED'), // 'SCHEDULED', 'COMPLETED', 'OVERDUE'
  revisionNotes: text('revision_notes'),
  confidenceScore: integer('confidence_score').default(0),
  createdAt: text('created_at').notNull(),
});

export const placementItems = sqliteTable('placement_items', {
  id: text('id').primaryKey(),
  category: text('category').notNull(), // 'DSA', 'Aptitude', 'Core CS', 'Interview Prep', 'Projects', 'Resume'
  title: text('title').notNull(),
  status: text('status').notNull().default('NOT_STARTED'),
  priority: text('priority').default('Medium'),
  notes: text('notes'),
  updatedAt: text('updated_at'),
});

export const userSettings = sqliteTable('user_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
