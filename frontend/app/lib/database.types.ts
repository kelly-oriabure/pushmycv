export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          resume_id: string
          course: string
          institution: string | null
          start_date: string | null
          end_date: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          course: string
          institution?: string | null
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          course?: string
          institution?: string | null
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          id: string
          resume_id: string
          school: string
          degree: string | null
          start_date: string | null
          end_date: string | null
          description: string | null
          created_at: string | null
          location: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          school: string
          degree?: string | null
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          created_at?: string | null
          location?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          school?: string
          degree?: string | null
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          created_at?: string | null
          location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      experience: {
        Row: {
          id: string
          resume_id: string
          employer: string
          jobTitle: string
          start_date: string | null
          end_date: string | null
          description: string | null
          location: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          employer: string
          jobTitle: string
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          location?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          employer?: string
          jobTitle?: string
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          location?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          id: string
          resume_id: string
          employer: string
          jobTitle: string
          start_date: string | null
          end_date: string | null
          description: string | null
          location: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          employer: string
          jobTitle: string
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          location?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          employer?: string
          jobTitle?: string
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          location?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internships_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          id: string
          resume_id: string
          name: string
          proficiency: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          name: string
          proficiency?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          name?: string
          proficiency?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "languages_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_summaries: {
        Row: {
          id: string
          resume_id: string
          content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          content: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          content?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_summaries_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      references: {
        Row: {
          id: string
          resume_id: string
          name: string
          company: string | null
          email: string | null
          phone: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          name: string
          company?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          name?: string
          company?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "references_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          resume_id: string
          name: string
          level: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          resume_id: string
          name: string
          level?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          resume_id?: string
          name?: string
          level?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never