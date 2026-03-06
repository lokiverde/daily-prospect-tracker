export type UserRole = 'agent' | 'team_leader' | 'broker' | 'admin'
export type BrokerageVisibility = 'public' | 'private'
export type ActivityCategory = 'closing' | 'contract' | 'lead_mgmt' | 'appointment' | 'contact' | 'marketing' | 'nurture'
export type GoalSetBy = 'self' | 'admin'

export type Database = {
  public: {
    Tables: {
      brokerages: {
        Row: {
          id: string
          name: string
          owner_id: string
          logo_url: string | null
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          logo_url?: string | null
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          logo_url?: string | null
          settings?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'brokerages_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          team_id: string | null
          brokerage_id: string | null
          role: UserRole
          brokerage_visibility: BrokerageVisibility
          is_onboarded: boolean
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          team_id?: string | null
          brokerage_id?: string | null
          role?: UserRole
          brokerage_visibility?: BrokerageVisibility
          is_onboarded?: boolean
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          team_id?: string | null
          brokerage_id?: string | null
          role?: UserRole
          brokerage_visibility?: BrokerageVisibility
          is_onboarded?: boolean
          settings?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          leader_id: string
          brokerage_id: string | null
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          leader_id: string
          brokerage_id?: string | null
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          leader_id?: string
          brokerage_id?: string | null
          settings?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_leader_id_fkey'
            columns: ['leader_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teams_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
          },
        ]
      }
      activity_types: {
        Row: {
          id: string
          name: string
          description: string | null
          points: number
          category: ActivityCategory
          icon: string | null
          sort_order: number
          is_default: boolean
          is_active: boolean
          max_daily: number | null
          team_id: string | null
          brokerage_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          points: number
          category: ActivityCategory
          icon?: string | null
          sort_order?: number
          is_default?: boolean
          is_active?: boolean
          max_daily?: number | null
          team_id?: string | null
          brokerage_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          points?: number
          category?: ActivityCategory
          icon?: string | null
          sort_order?: number
          is_default?: boolean
          is_active?: boolean
          max_daily?: number | null
          team_id?: string | null
          brokerage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'activity_types_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_types_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
          },
        ]
      }
      activities: {
        Row: {
          id: string
          user_id: string
          activity_type_id: string
          points: number
          contact_name: string | null
          notes: string | null
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type_id: string
          points: number
          contact_name?: string | null
          notes?: string | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          activity_type_id?: string
          points?: number
          contact_name?: string | null
          notes?: string | null
          logged_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activities_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activities_activity_type_id_fkey'
            columns: ['activity_type_id']
            isOneToOne: false
            referencedRelation: 'activity_types'
            referencedColumns: ['id']
          },
        ]
      }
      goals: {
        Row: {
          id: string
          user_id: string
          year: number
          annual_income_goal: number | null
          avg_commission_pct: number | null
          avg_sale_price: number | null
          closings_goal: number | null
          contracts_goal: number | null
          appointments_goal: number | null
          contacts_goal: number | null
          daily_points_goal: number
          set_by: GoalSetBy
          set_by_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          annual_income_goal?: number | null
          avg_commission_pct?: number | null
          avg_sale_price?: number | null
          closings_goal?: number | null
          contracts_goal?: number | null
          appointments_goal?: number | null
          contacts_goal?: number | null
          daily_points_goal?: number
          set_by?: GoalSetBy
          set_by_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          year?: number
          annual_income_goal?: number | null
          avg_commission_pct?: number | null
          avg_sale_price?: number | null
          closings_goal?: number | null
          contracts_goal?: number | null
          appointments_goal?: number | null
          contacts_goal?: number | null
          daily_points_goal?: number
          set_by?: GoalSetBy
          set_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_goal_date: string | null
          shields_earned: number
          shields_available: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_goal_date?: string | null
          shields_earned?: number
          shields_available?: number
          updated_at?: string
        }
        Update: {
          current_streak?: number
          longest_streak?: number
          last_goal_date?: string | null
          shields_earned?: number
          shields_available?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'streaks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      quotes: {
        Row: {
          id: string
          text: string
          author: string | null
          category: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          text: string
          author?: string | null
          category?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          text?: string
          author?: string | null
          category?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      daily_stats: {
        Row: {
          user_id: string
          date: string
          total_points: number
          activity_count: number
          unique_activities: number
        }
        Relationships: []
      }
      weekly_leaderboard: {
        Row: {
          user_id: string
          full_name: string
          avatar_url: string | null
          team_id: string | null
          brokerage_id: string | null
          total_points: number
          activity_count: number
          current_streak: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_leaderboard: {
        Args: {
          p_period?: string
          p_team_id?: string
          p_brokerage_id?: string
        }
        Returns: {
          user_id: string
          full_name: string
          avatar_url: string | null
          team_id: string | null
          brokerage_id: string | null
          brokerage_visibility: string
          total_points: number
          activity_count: number
          current_streak: number
        }[]
      }
      get_member_activity_summary: {
        Args: {
          p_user_id: string
          p_period?: string
        }
        Returns: {
          activity_name: string
          activity_icon: string | null
          activity_count: number
          total_points: number
        }[]
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
