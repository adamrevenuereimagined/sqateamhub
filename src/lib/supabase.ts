import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    env: import.meta.env
  });
  throw new Error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'rep';
  quarterly_quota: number;
  is_active: boolean;
};

export type Week = {
  id: string;
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'archived';
};

export type OneOnOneSubmission = {
  id: string;
  user_id: string;
  week_id: string;
  is_one_on_one_week: boolean;
  wins: Array<string>;
  whats_working_well: string;
  positive_feedback: string;
  prospecting_activities: number;
  decision_maker_connects: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
  revenue_mtd: number;
  revenue_qtd: number;
  average_deal_size: number;
  deals_moved_forward: Array<any>;
  deals_at_risk: Array<any>;
  top_deals: Array<any>;
  call_review_link: string;
  call_review_focus: string;
  blockers_help: string;
  deal_blockers: Array<string>;
  support_needed: Array<string>;
  self_care: string;
  energy_level: 'high' | 'medium' | 'low';
  manager_support: string;
  deal_selected_link: string;
  spiced_situation: string;
  spiced_pain: string;
  spiced_impact: string;
  spiced_critical_event: string;
  spiced_decision: string;
  spiced_decision_process: string;
  status: 'not_started' | 'in_progress' | 'submitted';
  submitted_at?: string;
};

export type Commitment = {
  id: string;
  one_on_one_id: string;
  commitment_text: string;
  deadline: string;
  success_metric: string;
  status: 'accomplished' | 'in_progress' | 'not_started' | 'blocked';
  notes: string;
};

export type BDWeeklyMeeting = {
  id: string;
  week_id: string;
  team_mtd_target: number;
  team_mtd_actual: number;
  team_qtd_target: number;
  team_qtd_actual: number;
  deals_closed_this_week: number;
  team_pipeline_coverage: number;
  win_rep_name: string;
  win_details: string;
  win_takeaway: string;
  adam_topics: string;
  coaching_focus: string;
  coaching_leader: string;
  messaging_landing: string;
  objections_hearing: string;
  competitive_intel: string;
  content_needs: string;
  exec_assist_deals: string;
  exec_assist_financial: string;
  exec_assist_partnerships: string;
  open_topics: string;
  pipeline_chart_url: string;
};

export type BDWeeklyRepData = {
  id: string;
  meeting_id: string;
  user_id: string;
  cold_calls: number;
  li_messages: number;
  videos: number;
  dm_connects: number;
  meetings_booked: number;
  deals_advanced: number;
  deals_advancing: Array<any>;
  deals_stalling: Array<any>;
  new_deals: Array<any>;
  closing_opportunities: Array<any>;
  f2f_meetings: Array<any>;
};

export type WeeklyGoal = {
  id: string;
  meeting_id: string;
  user_id: string;
  goal_text: string;
  achieved?: 'yes' | 'partial' | 'no';
  notes: string;
};

export type WeeklyActivityTargets = {
  id: string;
  user_id: string;
  target_cold_calls: number;
  target_li_messages: number;
  target_videos: number;
  target_dm_connects: number;
  target_meetings_booked: number;
  target_discovery_calls: number;
  target_opportunities_advanced: number;
  target_pipeline_value: number;
  created_at: string;
  updated_at: string;
};
