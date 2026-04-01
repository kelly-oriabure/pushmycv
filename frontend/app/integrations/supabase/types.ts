export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          course: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          institution: string | null
          resume_id: string
          start_date: string | null
        }
        Insert: {
          course: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution?: string | null
          resume_id: string
          start_date?: string | null
        }
        Update: {
          course?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution?: string | null
          resume_id?: string
          start_date?: string | null
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
          created_at: string | null
          degree: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          resume_id: string
          school: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          resume_id: string
          school: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          resume_id?: string
          school?: string
          start_date?: string | null
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
          created_at: string | null
          description: string | null
          employer: string
          end_date: string | null
          id: string
          jobTitle: string
          location: string | null
          resume_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employer: string
          end_date?: string | null
          id?: string
          jobTitle: string
          location?: string | null
          resume_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employer?: string
          end_date?: string | null
          id?: string
          jobTitle?: string
          location?: string | null
          resume_id?: string
          start_date?: string | null
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
          created_at: string | null
          description: string | null
          employer: string
          end_date: string | null
          id: string
          jobTitle: string
          location: string | null
          resume_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employer: string
          end_date?: string | null
          id?: string
          jobTitle: string
          location?: string | null
          resume_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employer?: string
          end_date?: string | null
          id?: string
          jobTitle?: string
          location?: string | null
          resume_id?: string
          start_date?: string | null
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
          created_at: string | null
          id: string
          name: string
          proficiency: string | null
          resume_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          proficiency?: string | null
          resume_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          proficiency?: string | null
          resume_id?: string
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
      personal_details: {
        Row: {
          address: string | null
          city_state: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          phone: string | null
          photo_url: string | null
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city_state?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          photo_url?: string | null
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city_state?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          photo_url?: string | null
          resume_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_details_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: true
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_summaries: {
        Row: {
          content: string
          created_at: string | null
          id: string
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          resume_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          has_onboarded: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_onboarded?: boolean | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_onboarded?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      references: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          resume_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          resume_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          resume_id?: string
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
      resume_analyses: {
        Row: {
          ats_explanation: string | null
          ats_score: number | null
          ats_tips: Json | null
          ats_tips_tip: string | null
          ats_type: string | null
          brevity_score: number | null
          brevity_tips: Json | null
          brevity_tips_explanation: string | null
          brevity_tips_tip: string | null
          brevity_tips_type: string | null
          content_explanation: string | null
          content_score: number | null
          content_tips: Json | null
          content_tips_tip: string | null
          content_type: string | null
          created_at: string | null
          email_explanation: string | null
          email_score: number | null
          email_tips: Json | null
          email_tips_tip: string | null
          email_tips_type: string | null
          error_message: string | null
          id: string
          job_title: string
          length_explanation: string | null
          length_score: number | null
          length_tips: Json | null
          length_tips_tip: string | null
          length_tips_type: string | null
          overall_score: number | null
          score_breakdown: Json | null
          skills_explanation: string | null
          skills_score: number | null
          skills_tips: Json | null
          skills_tips_tip: string | null
          skills_type: string | null
          status: string | null
          structure_explanation: string | null
          structure_score: number | null
          structure_tips: Json | null
          structure_tips_tip: string | null
          structure_tips_type: string | null
          suggestions: Json | null
          tone_score: number | null
          tone_tips: Json | null
          tonestyle_explanation: string | null
          tonestyle_score: number | null
          tonestyle_tips_tip: string | null
          tonestyle_tips_type: string | null
          updated_at: string | null
          upload_id: string
          user_id: string
        }
        Insert: {
          ats_explanation?: string | null
          ats_score?: number | null
          ats_tips?: Json | null
          ats_tips_tip?: string | null
          ats_type?: string | null
          brevity_score?: number | null
          brevity_tips?: Json | null
          brevity_tips_explanation?: string | null
          brevity_tips_tip?: string | null
          brevity_tips_type?: string | null
          content_explanation?: string | null
          content_score?: number | null
          content_tips?: Json | null
          content_tips_tip?: string | null
          content_type?: string | null
          created_at?: string | null
          email_explanation?: string | null
          email_score?: number | null
          email_tips?: Json | null
          email_tips_tip?: string | null
          email_tips_type?: string | null
          error_message?: string | null
          id?: string
          job_title: string
          length_explanation?: string | null
          length_score?: number | null
          length_tips?: Json | null
          length_tips_tip?: string | null
          length_tips_type?: string | null
          overall_score?: number | null
          score_breakdown?: Json | null
          skills_explanation?: string | null
          skills_score?: number | null
          skills_tips?: Json | null
          skills_tips_tip?: string | null
          skills_type?: string | null
          status?: string | null
          structure_explanation?: string | null
          structure_score?: number | null
          structure_tips?: Json | null
          structure_tips_tip?: string | null
          structure_tips_type?: string | null
          suggestions?: Json | null
          tone_score?: number | null
          tone_tips?: Json | null
          tonestyle_explanation?: string | null
          tonestyle_score?: number | null
          tonestyle_tips_tip?: string | null
          tonestyle_tips_type?: string | null
          updated_at?: string | null
          upload_id: string
          user_id: string
        }
        Update: {
          ats_explanation?: string | null
          ats_score?: number | null
          ats_tips?: Json | null
          ats_tips_tip?: string | null
          ats_type?: string | null
          brevity_score?: number | null
          brevity_tips?: Json | null
          brevity_tips_explanation?: string | null
          brevity_tips_tip?: string | null
          brevity_tips_type?: string | null
          content_explanation?: string | null
          content_score?: number | null
          content_tips?: Json | null
          content_tips_tip?: string | null
          content_type?: string | null
          created_at?: string | null
          email_explanation?: string | null
          email_score?: number | null
          email_tips?: Json | null
          email_tips_tip?: string | null
          email_tips_type?: string | null
          error_message?: string | null
          id?: string
          job_title?: string
          length_explanation?: string | null
          length_score?: number | null
          length_tips?: Json | null
          length_tips_tip?: string | null
          length_tips_type?: string | null
          overall_score?: number | null
          score_breakdown?: Json | null
          skills_explanation?: string | null
          skills_score?: number | null
          skills_tips?: Json | null
          skills_tips_tip?: string | null
          skills_type?: string | null
          status?: string | null
          structure_explanation?: string | null
          structure_score?: number | null
          structure_tips?: Json | null
          structure_tips_tip?: string | null
          structure_tips_type?: string | null
          suggestions?: Json | null
          tone_score?: number | null
          tone_tips?: Json | null
          tonestyle_explanation?: string | null
          tonestyle_score?: number | null
          tonestyle_tips_tip?: string | null
          tonestyle_tips_type?: string | null
          updated_at?: string | null
          upload_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_analyses_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "resume_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_courses: {
        Row: {
          course: string
          created_at: string | null
          display_order: number | null
          end_date: string
          id: string
          institution: string
          resume_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          course: string
          created_at?: string | null
          display_order?: number | null
          end_date: string
          id?: string
          institution: string
          resume_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          course?: string
          created_at?: string | null
          display_order?: number | null
          end_date?: string
          id?: string
          institution?: string
          resume_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_courses_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_education: {
        Row: {
          created_at: string | null
          degree: string
          description: string | null
          display_order: number | null
          end_date: string
          id: string
          location: string | null
          resume_id: string
          school: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          degree: string
          description?: string | null
          display_order?: number | null
          end_date: string
          id?: string
          location?: string | null
          resume_id: string
          school: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          display_order?: number | null
          end_date?: string
          id?: string
          location?: string | null
          resume_id?: string
          school?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_education_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_employment_history: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          employer: string
          end_date: string
          id: string
          job_title: string
          location: string | null
          resume_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          employer: string
          end_date: string
          id?: string
          job_title: string
          location?: string | null
          resume_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          employer?: string
          end_date?: string
          id?: string
          job_title?: string
          location?: string | null
          resume_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_employment_history_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_languages: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          resume_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_languages_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_personal_details: {
        Row: {
          address: string | null
          city_state: string | null
          country: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          phone: string
          photo_url: string | null
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city_state?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          phone: string
          photo_url?: string | null
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city_state?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          phone?: string
          photo_url?: string | null
          resume_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_personal_details_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_professional_summary: {
        Row: {
          created_at: string | null
          id: string
          resume_id: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          resume_id: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resume_id?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_professional_summary_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_references: {
        Row: {
          company: string | null
          created_at: string | null
          display_order: number | null
          email: string | null
          id: string
          name: string
          phone: string | null
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          resume_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_references_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_references_settings: {
        Row: {
          created_at: string | null
          hide_references: boolean | null
          id: string
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hide_references?: boolean | null
          id?: string
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hide_references?: boolean | null
          id?: string
          resume_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_references_settings_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_skills: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          level: number
          name: string
          resume_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          level: number
          name: string
          resume_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          level?: number
          name?: string
          resume_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_skills_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_uploads: {
        Row: {
          composite_hash: string | null
          content_hash: string | null
          created_at: string | null
          email_hash: string | null
          extracted_email: string | null
          extracted_phone: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          image_url: string | null
          id: string
          pdf_url: string | null
          phone_hash: string | null
          resume_url: string
          updated_at: string | null
          upload_time: string | null
          user_id: string
        }
        Insert: {
          composite_hash?: string | null
          content_hash?: string | null
          created_at?: string | null
          email_hash?: string | null
          extracted_email?: string | null
          extracted_phone?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          image_url?: string | null
          id?: string
          pdf_url?: string | null
          phone_hash?: string | null
          resume_url: string
          updated_at?: string | null
          upload_time?: string | null
          user_id: string
        }
        Update: {
          composite_hash?: string | null
          content_hash?: string | null
          created_at?: string | null
          email_hash?: string | null
          extracted_email?: string | null
          extracted_phone?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          image_url?: string | null
          id?: string
          pdf_url?: string | null
          phone_hash?: string | null
          resume_url?: string
          updated_at?: string | null
          upload_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          color: string | null
          created_at: string | null
          custom_sections: Json | null
          id: string
          template_id: string | null
          template_name: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          custom_sections?: Json | null
          id?: string
          template_id?: string | null
          template_name?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          custom_sections?: Json | null
          id?: string
          template_id?: string | null
          template_name?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["uuid"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          name: string
          resume_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          name: string
          resume_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          name?: string
          resume_id?: string
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
      template_categories: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          is_premium: boolean | null
          name: string
          thumbnail_url: string | null
          updated_at: string | null
          uuid: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          is_premium?: boolean | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          is_premium?: boolean | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_resume: {
        Args: { resume_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
