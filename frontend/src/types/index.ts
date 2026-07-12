export interface User {
  id: string
  name: string
  email: string
  avatar_url: string
  role: 'user' | 'admin'
  timezone: string
  locale: string
  is_active: boolean
  email_verified: boolean
  two_factor_enabled: boolean
  last_login_at: string | null
  created_at: string
  profile?: Profile
  active_roadmap?: ActiveRoadmapSummary | null
}

export interface Profile {
  bio: string | null
  website: string | null
  github_username: string | null
  daily_goal_minutes: number
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferred_language: string
  learning_style: 'visual' | 'reading' | 'hands_on' | 'mixed'
  xp_points: number
  level: number
  streak_days: number
  level_progress: { current: number; required: number; percentage: number }
  total_lessons_completed: number
  total_quizzes_passed: number
  total_projects_completed: number
  last_activity_date: string | null
}

export interface ActiveRoadmapSummary {
  id: string
  title: string
  goal: string
  progress_percentage: number
  status: string
  completed_lessons: number
  total_lessons: number
  estimated_completion?: string | null
}

export interface Roadmap {
  id: string
  title: string
  description: string | null
  goal: string
  experience_level: string
  daily_hours: number
  preferred_language: string
  learning_style: string
  status: 'active' | 'completed' | 'paused' | 'archived'
  deadline: string | null
  estimated_completion: string | null
  progress_percentage: number
  total_topics: number
  completed_topics: number
  total_lessons: number
  completed_lessons: number
  created_at: string
  skills?: Skill[]
  projects?: Project[]
}

export interface Skill {
  id: string
  name: string
  description: string | null
  order: number
  status: 'locked' | 'in_progress' | 'completed'
  progress_percentage: number
  topics?: Topic[]
}

export interface Topic {
  id: string
  name: string
  description: string | null
  learning_objectives: string | null
  order: number
  status: 'locked' | 'in_progress' | 'completed'
  estimated_minutes: number
  difficulty: number
  xp_reward: number
  completed_lessons: number
  total_lessons: number
  completed_at: string | null
  is_review_due: boolean
  next_review_at: string | null
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  description: string | null
  content: string | null
  type: 'lesson' | 'quiz' | 'project' | 'assignment' | 'review'
  order: number
  status: 'locked' | 'available' | 'in_progress' | 'completed'
  estimated_minutes: number
  xp_reward: number
  completed_at: string | null
  topic?: Topic & { skill?: Skill & { roadmap?: { id: string; title: string } } }
  resources?: LearningResource[]
  quiz?: QuizSummary | null
}

export interface LearningResource {
  id: string
  title: string
  url: string
  type: 'video' | 'article' | 'documentation' | 'book' | 'course' | 'github' | 'tool' | 'other'
  source: string | null
  description: string | null
  is_free: boolean
  duration_minutes: number | null
  is_required: boolean
}

export interface QuizSummary {
  id: string
  title: string
  passing_score: number
  time_limit_minutes: number | null
  questions_count: number
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  total_points: number
  questions_count: number
  questions: QuizQuestion[]
  can_attempt: boolean
  attempts_remaining: number
  best_score: number
}

export interface QuizQuestion {
  id: number
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  question: string
  options?: string[]
  points: number
}

export interface DailyTask {
  id: string
  lesson_id: string | null
  scheduled_date: string
  title: string
  description: string | null
  type: 'lesson' | 'quiz' | 'project' | 'review' | 'practice'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  estimated_minutes: number
  xp_reward: number
  completed_at: string | null
  order: number
  lesson?: Lesson | null
}

export interface Project {
  id: string
  title: string
  description: string
  requirements: string
  technologies: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  status: 'pending' | 'in_progress' | 'submitted' | 'reviewed' | 'completed'
  estimated_hours: number
  xp_reward: number
  submission_url: string | null
  github_url: string | null
  ai_feedback: Record<string, unknown> | null
  score: number | null
}

export interface OnboardingGoals {
  goal: string
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  daily_hours: number
  preferred_language: string
  learning_style: 'visual' | 'reading' | 'hands_on' | 'mixed'
  deadline?: string
}

export interface DashboardData {
  user: User
  today_tasks: DailyTask[]
  current_lesson: Lesson | null
  current_topic: Topic | null
  active_roadmap: ActiveRoadmapSummary | null
  stats: {
    xp_points: number
    level: number
    streak_days: number
    total_lessons_completed: number
    due_reviews: number
    tasks_today: { total: number; completed: number }
  }
  weekly_stats: Array<{ scheduled_date: string; total: number; completed: number }>
  level_progress: { current: number; required: number; percentage: number }
}

export interface Notification {
  id: string
  type: 'lesson_completed' | 'lesson_unlocked' | 'level_up' | 'streak' | string
  title: string
  message: string
  data: Record<string, unknown> | null
  icon: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
