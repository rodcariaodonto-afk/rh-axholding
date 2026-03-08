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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: unknown
          is_sensitive: boolean
          organization_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_sensitive?: boolean
          organization_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_sensitive?: boolean
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bonuses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bonus_type: Database["public"]["Enums"]["bonus_type"]
          created_at: string
          currency: string
          description: string | null
          effective_date: string
          employee_id: string
          id: string
          modified_by: string | null
          notes: string | null
          organization_id: string
          payment_date: string | null
          reference_period: string | null
          status: Database["public"]["Enums"]["bonus_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bonus_type: Database["public"]["Enums"]["bonus_type"]
          created_at?: string
          currency?: string
          description?: string | null
          effective_date: string
          employee_id: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          organization_id: string
          payment_date?: string | null
          reference_period?: string | null
          status?: Database["public"]["Enums"]["bonus_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bonus_type?: Database["public"]["Enums"]["bonus_type"]
          created_at?: string
          currency?: string
          description?: string | null
          effective_date?: string
          employee_id?: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          organization_id?: string
          payment_date?: string | null
          reference_period?: string | null
          status?: Database["public"]["Enums"]["bonus_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonuses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonuses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cost_settings: {
        Row: {
          created_at: string | null
          enable_severance_provision: boolean
          fgts_rate: number
          id: string
          inss_employer_rate: number
          modified_by: string | null
          organization_id: string | null
          rat_rate: number
          system_s_rate: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enable_severance_provision?: boolean
          fgts_rate?: number
          id?: string
          inss_employer_rate?: number
          modified_by?: string | null
          organization_id?: string | null
          rat_rate?: number
          system_s_rate?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enable_severance_provision?: boolean
          fgts_rate?: number
          id?: string
          inss_employer_rate?: number
          modified_by?: string | null
          organization_id?: string | null
          rat_rate?: number
          system_s_rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cost_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_cost_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_culture: {
        Row: {
          created_at: string | null
          id: string
          mission: string | null
          modified_by: string | null
          organization_id: string | null
          swot_opportunities: string | null
          swot_strengths: string | null
          swot_threats: string | null
          swot_weaknesses: string | null
          updated_at: string | null
          values: Json | null
          vision: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mission?: string | null
          modified_by?: string | null
          organization_id?: string | null
          swot_opportunities?: string | null
          swot_strengths?: string | null
          swot_threats?: string | null
          swot_weaknesses?: string | null
          updated_at?: string | null
          values?: Json | null
          vision?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mission?: string | null
          modified_by?: string | null
          organization_id?: string | null
          swot_opportunities?: string | null
          swot_strengths?: string | null
          swot_threats?: string | null
          swot_weaknesses?: string | null
          updated_at?: string | null
          values?: Json | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_culture_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_culture_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      compensation_history: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_salary: number
          change_percentage: number | null
          created_at: string
          effective_date: string
          employee_id: string
          id: string
          modified_by: string | null
          notes: string | null
          organization_id: string
          previous_salary: number | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary: number
          change_percentage?: number | null
          created_at?: string
          effective_date: string
          employee_id: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          organization_id: string
          previous_salary?: number | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number
          change_percentage?: number | null
          created_at?: string
          effective_date?: string
          employee_id?: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          organization_id?: string
          previous_salary?: number | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compensation_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensation_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensation_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensation_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          extension: string | null
          fax: string | null
          id: string
          location: string | null
          manager_id: string | null
          monthly_budget: number | null
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          extension?: string | null
          fax?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          monthly_budget?: number | null
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          extension?: string | null
          fax?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          monthly_budget?: number | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          disk: number | null
          hexnode_registered: boolean | null
          id: string
          model: string
          notes: string | null
          organization_id: string | null
          processor: string | null
          ram: number | null
          screen_size: number | null
          serial: string | null
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string | null
          user_id: string | null
          user_name: string
          warranty_date: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          disk?: number | null
          hexnode_registered?: boolean | null
          id?: string
          model: string
          notes?: string | null
          organization_id?: string | null
          processor?: string | null
          ram?: number | null
          screen_size?: number | null
          serial?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string | null
          user_id?: string | null
          user_name: string
          warranty_date?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          disk?: number | null
          hexnode_registered?: boolean | null
          id?: string
          model?: string
          notes?: string | null
          organization_id?: string | null
          processor?: string | null
          ram?: number | null
          screen_size?: number | null
          serial?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string | null
          user_id?: string | null
          user_name?: string
          warranty_date?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_changes: {
        Row: {
          changed_by: string
          created_at: string
          employee_id: string
          field_label: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          employee_id: string
          field_label: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          employee_id?: string
          field_label?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_changes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          employee_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          employee_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          assessed_at: string | null
          assessed_by: string | null
          created_at: string
          current_level: number
          employee_id: string
          expected_level: number | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          skill_id: string
          skill_type: string
          updated_at: string
        }
        Insert: {
          assessed_at?: string | null
          assessed_by?: string | null
          created_at?: string
          current_level?: number
          employee_id: string
          expected_level?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          skill_id: string
          skill_type: string
          updated_at?: string
        }
        Update: {
          assessed_at?: string | null
          assessed_by?: string | null
          created_at?: string
          current_level?: number
          employee_id?: string
          expected_level?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          skill_id?: string
          skill_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_trainings: {
        Row: {
          career_points: number | null
          certificate_url: string | null
          completion_date: string
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          employee_id: string
          from_pdi: boolean
          generates_points: boolean
          hours: number
          id: string
          name: string
          pdi_goal_id: string | null
          pdi_id: string | null
          sponsor: string
          training_type: string
          updated_at: string
        }
        Insert: {
          career_points?: number | null
          certificate_url?: string | null
          completion_date: string
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          employee_id: string
          from_pdi?: boolean
          generates_points?: boolean
          hours?: number
          id?: string
          name: string
          pdi_goal_id?: string | null
          pdi_id?: string | null
          sponsor?: string
          training_type?: string
          updated_at?: string
        }
        Update: {
          career_points?: number | null
          certificate_url?: string | null
          completion_date?: string
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          employee_id?: string
          from_pdi?: boolean
          generates_points?: boolean
          hours?: number
          id?: string
          name?: string
          pdi_goal_id?: string | null
          pdi_id?: string | null
          sponsor?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_pdi_goal_id_fkey"
            columns: ["pdi_goal_id"]
            isOneToOne: false
            referencedRelation: "pdi_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          base_position_id: string | null
          birth_date: string | null
          birthplace: string | null
          created_at: string
          department_id: string | null
          education_course: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          email: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          ethnicity: Database["public"]["Enums"]["ethnicity"] | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          manager_id: string | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          nationality: string | null
          number_of_children: number | null
          organization_id: string | null
          photo_url: string | null
          position_level_detail:
            | Database["public"]["Enums"]["position_level_detail"]
            | null
          profiler_completed_at: string | null
          profiler_result_code: string | null
          profiler_result_detail: Json | null
          status: Database["public"]["Enums"]["employee_status"]
          termination_cause:
            | Database["public"]["Enums"]["termination_cause"]
            | null
          termination_cost: number | null
          termination_date: string | null
          termination_decision:
            | Database["public"]["Enums"]["termination_decision"]
            | null
          termination_notes: string | null
          termination_reason:
            | Database["public"]["Enums"]["termination_reason"]
            | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          base_position_id?: string | null
          birth_date?: string | null
          birthplace?: string | null
          created_at?: string
          department_id?: string | null
          education_course?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          email: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          ethnicity?: Database["public"]["Enums"]["ethnicity"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          manager_id?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          nationality?: string | null
          number_of_children?: number | null
          organization_id?: string | null
          photo_url?: string | null
          position_level_detail?:
            | Database["public"]["Enums"]["position_level_detail"]
            | null
          profiler_completed_at?: string | null
          profiler_result_code?: string | null
          profiler_result_detail?: Json | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_cause?:
            | Database["public"]["Enums"]["termination_cause"]
            | null
          termination_cost?: number | null
          termination_date?: string | null
          termination_decision?:
            | Database["public"]["Enums"]["termination_decision"]
            | null
          termination_notes?: string | null
          termination_reason?:
            | Database["public"]["Enums"]["termination_reason"]
            | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          base_position_id?: string | null
          birth_date?: string | null
          birthplace?: string | null
          created_at?: string
          department_id?: string | null
          education_course?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          email?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          ethnicity?: Database["public"]["Enums"]["ethnicity"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          manager_id?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          nationality?: string | null
          number_of_children?: number | null
          organization_id?: string | null
          photo_url?: string | null
          position_level_detail?:
            | Database["public"]["Enums"]["position_level_detail"]
            | null
          profiler_completed_at?: string | null
          profiler_result_code?: string | null
          profiler_result_detail?: Json | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_cause?:
            | Database["public"]["Enums"]["termination_cause"]
            | null
          termination_cost?: number | null
          termination_date?: string | null
          termination_decision?:
            | Database["public"]["Enums"]["termination_decision"]
            | null
          termination_notes?: string | null
          termination_reason?:
            | Database["public"]["Enums"]["termination_reason"]
            | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_base_position_id_fkey"
            columns: ["base_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      employees_contact: {
        Row: {
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          city: string
          complement: string | null
          country: string
          cpf: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          home_phone: string | null
          mobile_phone: string | null
          neighborhood: string | null
          number: string
          personal_email: string | null
          pix_key: string | null
          rg: string | null
          rg_issuer: string | null
          state: string
          street: string
          updated_at: string | null
          user_id: string
          zip_code: string
        }
        Insert: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          city: string
          complement?: string | null
          country?: string
          cpf?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          home_phone?: string | null
          mobile_phone?: string | null
          neighborhood?: string | null
          number: string
          personal_email?: string | null
          pix_key?: string | null
          rg?: string | null
          rg_issuer?: string | null
          state: string
          street: string
          updated_at?: string | null
          user_id: string
          zip_code: string
        }
        Update: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          city?: string
          complement?: string | null
          country?: string
          cpf?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          home_phone?: string | null
          mobile_phone?: string | null
          neighborhood?: string | null
          number?: string
          personal_email?: string | null
          pix_key?: string | null
          rg?: string | null
          rg_issuer?: string | null
          state?: string
          street?: string
          updated_at?: string | null
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      employees_contracts: {
        Row: {
          base_salary: number
          contract_duration_days: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          dental_insurance: number | null
          health_insurance: number | null
          hire_date: string
          id: string
          is_active: boolean
          meal_voucher: number | null
          modified_by: string | null
          other_benefits: number | null
          probation_days: number | null
          transportation_voucher: number | null
          updated_at: string | null
          user_id: string
          weekly_hours: number
        }
        Insert: {
          base_salary: number
          contract_duration_days?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          dental_insurance?: number | null
          health_insurance?: number | null
          hire_date: string
          id?: string
          is_active?: boolean
          meal_voucher?: number | null
          modified_by?: string | null
          other_benefits?: number | null
          probation_days?: number | null
          transportation_voucher?: number | null
          updated_at?: string | null
          user_id: string
          weekly_hours?: number
        }
        Update: {
          base_salary?: number
          contract_duration_days?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          dental_insurance?: number | null
          health_insurance?: number | null
          hire_date?: string
          id?: string
          is_active?: boolean
          meal_voucher?: number | null
          modified_by?: string | null
          other_benefits?: number | null
          probation_days?: number | null
          transportation_voucher?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_hours?: number
        }
        Relationships: []
      }
      employees_demographics: {
        Row: {
          birth_date: string | null
          birthplace: string | null
          created_at: string | null
          education_course: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          ethnicity: Database["public"]["Enums"]["ethnicity"] | null
          gender: Database["public"]["Enums"]["gender"] | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          modified_by: string | null
          nationality: string | null
          number_of_children: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          birthplace?: string | null
          created_at?: string | null
          education_course?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          ethnicity?: Database["public"]["Enums"]["ethnicity"] | null
          gender?: Database["public"]["Enums"]["gender"] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          modified_by?: string | null
          nationality?: string | null
          number_of_children?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          birthplace?: string | null
          created_at?: string | null
          education_course?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          ethnicity?: Database["public"]["Enums"]["ethnicity"] | null
          gender?: Database["public"]["Enums"]["gender"] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          modified_by?: string | null
          nationality?: string | null
          number_of_children?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employees_legal_docs: {
        Row: {
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          cpf: string | null
          created_at: string | null
          modified_by: string | null
          pix_key: string | null
          rg: string | null
          rg_issuer: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cpf?: string | null
          created_at?: string | null
          modified_by?: string | null
          pix_key?: string | null
          rg?: string | null
          rg_issuer?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cpf?: string | null
          created_at?: string | null
          modified_by?: string | null
          pix_key?: string | null
          rg?: string | null
          rg_issuer?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equity: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          current_value: number | null
          description: string | null
          employee_id: string
          equity_type: Database["public"]["Enums"]["equity_type"]
          exercised_at: string | null
          expired_at: string | null
          grant_date: string
          id: string
          modified_by: string | null
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["equity_status"]
          strike_price: number | null
          units: number
          updated_at: string
          vested_units: number | null
          vesting_end_date: string | null
          vesting_schedule: Json | null
          vesting_start_date: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          current_value?: number | null
          description?: string | null
          employee_id: string
          equity_type: Database["public"]["Enums"]["equity_type"]
          exercised_at?: string | null
          expired_at?: string | null
          grant_date: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["equity_status"]
          strike_price?: number | null
          units: number
          updated_at?: string
          vested_units?: number | null
          vesting_end_date?: string | null
          vesting_schedule?: Json | null
          vesting_start_date?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          current_value?: number | null
          description?: string | null
          employee_id?: string
          equity_type?: Database["public"]["Enums"]["equity_type"]
          exercised_at?: string | null
          expired_at?: string | null
          grant_date?: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["equity_status"]
          strike_price?: number | null
          units?: number
          updated_at?: string
          vested_units?: number | null
          vesting_end_date?: string | null
          vesting_schedule?: Json | null
          vesting_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equity_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_cycles: {
        Row: {
          admission_cutoff_date: string | null
          allow_self_evaluation: boolean | null
          competency_comments_required: boolean | null
          contract_types: string[] | null
          created_at: string | null
          created_by: string
          custom_labels: Json | null
          description: string | null
          end_date: string
          evaluation_type: string
          id: string
          include_self_in_average: boolean | null
          name: string
          organization_id: string
          require_competency_comments: boolean | null
          require_general_comments: boolean | null
          scale_label_type: string
          scale_levels: number
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admission_cutoff_date?: string | null
          allow_self_evaluation?: boolean | null
          competency_comments_required?: boolean | null
          contract_types?: string[] | null
          created_at?: string | null
          created_by: string
          custom_labels?: Json | null
          description?: string | null
          end_date: string
          evaluation_type?: string
          id?: string
          include_self_in_average?: boolean | null
          name: string
          organization_id: string
          require_competency_comments?: boolean | null
          require_general_comments?: boolean | null
          scale_label_type?: string
          scale_levels?: number
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admission_cutoff_date?: string | null
          allow_self_evaluation?: boolean | null
          competency_comments_required?: boolean | null
          contract_types?: string[] | null
          created_at?: string | null
          created_by?: string
          custom_labels?: Json | null
          description?: string | null
          end_date?: string
          evaluation_type?: string
          id?: string
          include_self_in_average?: boolean | null
          name?: string
          organization_id?: string
          require_competency_comments?: boolean | null
          require_general_comments?: boolean | null
          scale_label_type?: string
          scale_levels?: number
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_cycles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_cycles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_general_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          participant_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          participant_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_general_comments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "evaluation_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_participants: {
        Row: {
          completed_at: string | null
          created_at: string | null
          cycle_id: string
          evaluated_id: string
          evaluator_id: string
          id: string
          relationship: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          cycle_id: string
          evaluated_id: string
          evaluator_id: string
          id?: string
          relationship: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          cycle_id?: string
          evaluated_id?: string
          evaluator_id?: string
          id?: string
          relationship?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_participants_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_participants_evaluated_id_fkey"
            columns: ["evaluated_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_participants_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_responses: {
        Row: {
          comment: string | null
          competency_id: string
          competency_type: string
          created_at: string | null
          id: string
          participant_id: string
          score: number
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          competency_id: string
          competency_type: string
          created_at?: string | null
          id?: string
          participant_id: string
          score: number
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          competency_id?: string
          competency_type?: string
          created_at?: string | null
          id?: string
          participant_id?: string
          score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "evaluation_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hard_skills: {
        Row: {
          area_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          level_junior: number | null
          level_pleno: number | null
          level_senior: number | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          level_junior?: number | null
          level_pleno?: number | null
          level_senior?: number | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          level_junior?: number | null
          level_pleno?: number | null
          level_senior?: number | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hard_skills_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "skill_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hard_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hard_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_access_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          organization_id: string
          performed_by: string | null
          provider: string
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id: string
          performed_by?: string | null
          provider: string
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          performed_by?: string | null
          provider?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "integration_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          ai_analysis_status:
            | Database["public"]["Enums"]["ai_analysis_status"]
            | null
          ai_report: string | null
          ai_score: number | null
          applied_at: string
          candidate_birth_date: string | null
          candidate_city: string | null
          candidate_email: string
          candidate_gender: string | null
          candidate_name: string
          candidate_pcd: boolean | null
          candidate_pcd_type: string | null
          candidate_phone: string | null
          candidate_race: string | null
          candidate_sexual_orientation: string | null
          candidate_state: string | null
          desired_position: string | null
          desired_seniority: string | null
          id: string
          job_id: string
          notes: string | null
          profiler_completed_at: string | null
          profiler_result_code: string | null
          profiler_result_detail: Json | null
          resume_url: string | null
          stage: Database["public"]["Enums"]["candidate_stage"]
          status: string
          updated_at: string
        }
        Insert: {
          ai_analysis_status?:
            | Database["public"]["Enums"]["ai_analysis_status"]
            | null
          ai_report?: string | null
          ai_score?: number | null
          applied_at?: string
          candidate_birth_date?: string | null
          candidate_city?: string | null
          candidate_email: string
          candidate_gender?: string | null
          candidate_name: string
          candidate_pcd?: boolean | null
          candidate_pcd_type?: string | null
          candidate_phone?: string | null
          candidate_race?: string | null
          candidate_sexual_orientation?: string | null
          candidate_state?: string | null
          desired_position?: string | null
          desired_seniority?: string | null
          id?: string
          job_id: string
          notes?: string | null
          profiler_completed_at?: string | null
          profiler_result_code?: string | null
          profiler_result_detail?: Json | null
          resume_url?: string | null
          stage?: Database["public"]["Enums"]["candidate_stage"]
          status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis_status?:
            | Database["public"]["Enums"]["ai_analysis_status"]
            | null
          ai_report?: string | null
          ai_score?: number | null
          applied_at?: string
          candidate_birth_date?: string | null
          candidate_city?: string | null
          candidate_email?: string
          candidate_gender?: string | null
          candidate_name?: string
          candidate_pcd?: boolean | null
          candidate_pcd_type?: string | null
          candidate_phone?: string | null
          candidate_race?: string | null
          candidate_sexual_orientation?: string | null
          candidate_state?: string | null
          desired_position?: string | null
          desired_seniority?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          profiler_completed_at?: string | null
          profiler_result_code?: string | null
          profiler_result_detail?: Json | null
          resume_url?: string | null
          stage?: Database["public"]["Enums"]["candidate_stage"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: string | null
          position_type: string
          requirements: string | null
          seniority: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          position_type: string
          requirements?: string | null
          seniority: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          position_type?: string
          requirements?: string | null
          seniority?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_descriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_descriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          benefits: string[] | null
          closed_at: string | null
          contract_type: string | null
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          description_context: string | null
          description_tone: string | null
          desired_skills: string[] | null
          education_level: string | null
          expected_start_date: string | null
          experience_years: number | null
          id: string
          languages: Json | null
          openings_count: number | null
          organization_id: string | null
          position_id: string | null
          require_cover_letter: boolean | null
          required_skills: string[] | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          salary_type: string | null
          seniority: string | null
          status: Database["public"]["Enums"]["job_status"]
          tags: string[] | null
          title: string
          unit_id: string | null
          updated_at: string
          urgency: string | null
          work_model: string | null
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string[] | null
          closed_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          description_context?: string | null
          description_tone?: string | null
          desired_skills?: string[] | null
          education_level?: string | null
          expected_start_date?: string | null
          experience_years?: number | null
          id?: string
          languages?: Json | null
          openings_count?: number | null
          organization_id?: string | null
          position_id?: string | null
          require_cover_letter?: boolean | null
          required_skills?: string[] | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          seniority?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title: string
          unit_id?: string | null
          updated_at?: string
          urgency?: string | null
          work_model?: string | null
        }
        Update: {
          application_deadline?: string | null
          benefits?: string[] | null
          closed_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          description_context?: string | null
          description_tone?: string | null
          desired_skills?: string[] | null
          education_level?: string | null
          expected_start_date?: string | null
          experience_years?: number | null
          id?: string
          languages?: Json | null
          openings_count?: number | null
          organization_id?: string | null
          position_id?: string | null
          require_cover_letter?: boolean | null
          required_skills?: string[] | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          seniority?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          urgency?: string | null
          work_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_appearance: {
        Row: {
          border_radius: string | null
          color_mode: string | null
          created_at: string | null
          custom_css: string | null
          font_family: string | null
          id: string
          organization_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          border_radius?: string | null
          color_mode?: string | null
          created_at?: string | null
          custom_css?: string | null
          font_family?: string | null
          id?: string
          organization_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          border_radius?: string | null
          color_mode?: string | null
          created_at?: string | null
          custom_css?: string | null
          font_family?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_appearance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_appearance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          encrypted_api_key: string
          environment: string
          id: string
          is_active: boolean
          last_error: string | null
          last_four: string | null
          last_rotated_at: string | null
          last_test_success: boolean | null
          last_tested_at: string | null
          last_used_at: string | null
          organization_id: string
          provider: string
          sensitivity: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          encrypted_api_key: string
          environment?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_four?: string | null
          last_rotated_at?: string | null
          last_test_success?: boolean | null
          last_tested_at?: string | null
          last_used_at?: string | null
          organization_id: string
          provider: string
          sensitivity?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          encrypted_api_key?: string
          environment?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_four?: string | null
          last_rotated_at?: string | null
          last_test_success?: boolean | null
          last_tested_at?: string | null
          last_used_at?: string | null
          organization_id?: string
          provider?: string
          sensitivity?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_locations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          organization_id: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          organization_id: string
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          organization_id?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          is_owner: boolean | null
          joined_at: string | null
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          is_owner?: boolean | null
          joined_at?: string | null
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          is_owner?: boolean | null
          joined_at?: string | null
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allowed_domains: string[] | null
          benefits: Json | null
          created_at: string
          description: string | null
          employee_count: string | null
          geolocation_required: boolean
          headquarters_city: string | null
          hiring_process_description: string | null
          hiring_time: string | null
          id: string
          industry: string | null
          instagram_handle: string | null
          interview_format: string | null
          invite_from_email: string | null
          invite_from_name: string | null
          is_active: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          max_employees: number | null
          name: string
          plan_type: string | null
          settings: Json | null
          slug: string
          team_structure: string | null
          tech_stack: string | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
          work_environment: string | null
          work_policy: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          benefits?: Json | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          geolocation_required?: boolean
          headquarters_city?: string | null
          hiring_process_description?: string | null
          hiring_time?: string | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          interview_format?: string | null
          invite_from_email?: string | null
          invite_from_name?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          max_employees?: number | null
          name: string
          plan_type?: string | null
          settings?: Json | null
          slug: string
          team_structure?: string | null
          tech_stack?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
          work_environment?: string | null
          work_policy?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          benefits?: Json | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          geolocation_required?: boolean
          headquarters_city?: string | null
          hiring_process_description?: string | null
          hiring_time?: string | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          interview_format?: string | null
          invite_from_email?: string | null
          invite_from_name?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          max_employees?: number | null
          name?: string
          plan_type?: string | null
          settings?: Json | null
          slug?: string
          team_structure?: string | null
          tech_stack?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
          work_environment?: string | null
          work_policy?: string | null
        }
        Relationships: []
      }
      pdi_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          goal_id: string | null
          id: string
          pdi_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          goal_id?: string | null
          id?: string
          pdi_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          goal_id?: string | null
          id?: string
          pdi_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_attachments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "pdi_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_attachments_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_comments: {
        Row: {
          content: string
          created_at: string
          edit_history: Json | null
          id: string
          pdi_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edit_history?: Json | null
          id?: string
          pdi_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edit_history?: Json | null
          id?: string
          pdi_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_comments_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_goals: {
        Row: {
          action_plan: string | null
          checklist_items: Json | null
          completion_ratio: number | null
          created_at: string
          criterion_id: string | null
          description: string | null
          display_order: number | null
          due_date: string
          goal_type: Database["public"]["Enums"]["pdi_goal_type"]
          id: string
          pdi_id: string
          status: Database["public"]["Enums"]["pdi_goal_status"]
          title: string
          training_id: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          action_plan?: string | null
          checklist_items?: Json | null
          completion_ratio?: number | null
          created_at?: string
          criterion_id?: string | null
          description?: string | null
          display_order?: number | null
          due_date: string
          goal_type?: Database["public"]["Enums"]["pdi_goal_type"]
          id?: string
          pdi_id: string
          status?: Database["public"]["Enums"]["pdi_goal_status"]
          title: string
          training_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          action_plan?: string | null
          checklist_items?: Json | null
          completion_ratio?: number | null
          created_at?: string
          criterion_id?: string | null
          description?: string | null
          display_order?: number | null
          due_date?: string
          goal_type?: Database["public"]["Enums"]["pdi_goal_type"]
          id?: string
          pdi_id?: string
          status?: Database["public"]["Enums"]["pdi_goal_status"]
          title?: string
          training_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_goals_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_logs: {
        Row: {
          created_at: string
          description: string
          event_type: string
          goal_id: string | null
          id: string
          logged_by: string
          metadata: Json | null
          pdi_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          goal_id?: string | null
          id?: string
          logged_by: string
          metadata?: Json | null
          pdi_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          goal_id?: string | null
          id?: string
          logged_by?: string
          metadata?: Json | null
          pdi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "pdi_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_logs_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdis: {
        Row: {
          created_at: string
          created_by: string
          current_state: string | null
          desired_state: string | null
          due_date: string
          employee_id: string
          engagement_score: number | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          manager_id: string | null
          objective: string | null
          progress: number | null
          start_date: string
          status: Database["public"]["Enums"]["pdi_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_state?: string | null
          desired_state?: string | null
          due_date: string
          employee_id: string
          engagement_score?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          manager_id?: string | null
          objective?: string | null
          progress?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["pdi_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_state?: string | null
          desired_state?: string | null
          due_date?: string
          employee_id?: string
          engagement_score?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          manager_id?: string | null
          objective?: string | null
          progress?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["pdi_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_employees: {
        Row: {
          base_position_id: string | null
          base_salary: number | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          created_at: string | null
          department_id: string | null
          email: string
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          expires_at: string | null
          full_name: string
          hire_date: string | null
          id: string
          invite_sent_at: string | null
          invited_by: string
          manager_id: string | null
          organization_id: string
          position_level_detail:
            | Database["public"]["Enums"]["position_level_detail"]
            | null
          status: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_position_id?: string | null
          base_salary?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string | null
          department_id?: string | null
          email: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          expires_at?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          invite_sent_at?: string | null
          invited_by: string
          manager_id?: string | null
          organization_id: string
          position_level_detail?:
            | Database["public"]["Enums"]["position_level_detail"]
            | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_position_id?: string | null
          base_salary?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          expires_at?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          invite_sent_at?: string | null
          invited_by?: string
          manager_id?: string | null
          organization_id?: string
          position_level_detail?:
            | Database["public"]["Enums"]["position_level_detail"]
            | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_employees_base_position_id_fkey"
            columns: ["base_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
          permission_id: string | null
          reason: string | null
          target_role_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          permission_id?: string | null
          reason?: string | null
          target_role_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          permission_id?: string | null
          reason?: string | null
          target_role_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          module: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id: string
          module: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      position_seniority_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          notes: string | null
          position_id: string
          required_skills: Json | null
          required_soft_skills: Json | null
          salary_max: number | null
          salary_min: number | null
          seniority: Database["public"]["Enums"]["seniority_level"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          position_id: string
          required_skills?: Json | null
          required_soft_skills?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          seniority: Database["public"]["Enums"]["seniority_level"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          position_id?: string
          required_skills?: Json | null
          required_soft_skills?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: Database["public"]["Enums"]["seniority_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_seniority_levels_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          activities: string | null
          created_at: string
          description: string | null
          expected_profile_code: string | null
          has_levels: boolean
          id: string
          organization_id: string | null
          parent_position_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          description?: string | null
          expected_profile_code?: string | null
          has_levels?: boolean
          id?: string
          organization_id?: string | null
          parent_position_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          description?: string | null
          expected_profile_code?: string | null
          has_levels?: boolean
          id?: string
          organization_id?: string | null
          parent_position_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_parent_position_id_fkey"
            columns: ["parent_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiler_history: {
        Row: {
          completed_at: string
          created_at: string
          employee_id: string
          id: string
          profiler_result_code: string
          profiler_result_detail: Json
        }
        Insert: {
          completed_at?: string
          created_at?: string
          employee_id: string
          id?: string
          profiler_result_code: string
          profiler_result_detail: Json
        }
        Update: {
          completed_at?: string
          created_at?: string
          employee_id?: string
          id?: string
          profiler_result_code?: string
          profiler_result_detail?: Json
        }
        Relationships: [
          {
            foreignKeyName: "profiler_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_entries: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address: unknown
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          function_name: string
          id: string
          rate_key: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          rate_key: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          rate_key?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_areas: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      soft_skills: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          level_junior: number | null
          level_pleno: number | null
          level_senior: number | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          level_junior?: number | null
          level_pleno?: number | null
          level_senior?: number | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          level_junior?: number | null
          level_pleno?: number | null
          level_senior?: number | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soft_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soft_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      time_balance: {
        Row: {
          balance_minutes: number
          created_at: string
          employee_id: string
          expected_minutes: number
          id: string
          organization_id: string
          overtime_minutes: number
          reference_month: string
          updated_at: string
          worked_minutes: number
        }
        Insert: {
          balance_minutes?: number
          created_at?: string
          employee_id: string
          expected_minutes?: number
          id?: string
          organization_id: string
          overtime_minutes?: number
          reference_month: string
          updated_at?: string
          worked_minutes?: number
        }
        Update: {
          balance_minutes?: number
          created_at?: string
          employee_id?: string
          expected_minutes?: number
          id?: string
          organization_id?: string
          overtime_minutes?: number
          reference_month?: string
          updated_at?: string
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "time_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_balance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_balance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_in_accuracy: number | null
          clock_in_latitude: number | null
          clock_in_longitude: number | null
          clock_in_within_fence: boolean | null
          clock_out: string | null
          clock_out_accuracy: number | null
          clock_out_latitude: number | null
          clock_out_longitude: number | null
          clock_out_within_fence: boolean | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          organization_id: string
          total_minutes: number | null
          updated_at: string
        }
        Insert: {
          clock_in?: string
          clock_in_accuracy?: number | null
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_in_within_fence?: boolean | null
          clock_out?: string | null
          clock_out_accuracy?: number | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          clock_out_within_fence?: boolean | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          notes?: string | null
          organization_id: string
          total_minutes?: number | null
          updated_at?: string
        }
        Update: {
          clock_in?: string
          clock_in_accuracy?: number | null
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_in_within_fence?: boolean | null
          clock_out?: string | null
          clock_out_accuracy?: number | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          clock_out_within_fence?: boolean | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          total_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_balances: {
        Row: {
          available_days: number | null
          created_at: string
          employee_id: string
          id: string
          policy_id: string
          total_days: number
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          available_days?: number | null
          created_at?: string
          employee_id: string
          id?: string
          policy_id: string
          total_days?: number
          updated_at?: string
          used_days?: number
          year: number
        }
        Update: {
          available_days?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          policy_id?: string
          total_days?: number
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "time_off_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_balances_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "time_off_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_policies: {
        Row: {
          created_at: string
          default_days_per_year: number
          description: string | null
          id: string
          is_active: boolean
          max_consecutive_days: number | null
          min_notice_days: number | null
          name: string
          organization_id: string | null
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_days_per_year: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          name: string
          organization_id?: string | null
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_days_per_year?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          name?: string
          organization_id?: string | null
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          policy_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          total_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          policy_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          total_days: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          policy_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "time_off_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      training_catalog: {
        Row: {
          career_points: number | null
          category: string | null
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          name: string
          organization_id: string
          provider: string | null
          skill_ids: string[] | null
          updated_at: string
        }
        Insert: {
          career_points?: number | null
          category?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name: string
          organization_id: string
          provider?: string | null
          skill_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          career_points?: number | null
          category?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name?: string
          organization_id?: string
          provider?: string | null
          skill_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      training_requests: {
        Row: {
          actual_cost: number | null
          certificate_url: string | null
          completed_at: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          feedback: string | null
          id: string
          justification: string
          manager_approved_at: string | null
          manager_id: string | null
          manager_notes: string | null
          organization_id: string
          pdi_goal_id: string | null
          people_approved_at: string | null
          people_approved_by: string | null
          people_notes: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["training_request_status"]
          submitted_at: string | null
          training_description: string | null
          training_id: string | null
          training_name: string | null
          training_provider: string | null
          training_url: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          feedback?: string | null
          id?: string
          justification: string
          manager_approved_at?: string | null
          manager_id?: string | null
          manager_notes?: string | null
          organization_id: string
          pdi_goal_id?: string | null
          people_approved_at?: string | null
          people_approved_by?: string | null
          people_notes?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_request_status"]
          submitted_at?: string | null
          training_description?: string | null
          training_id?: string | null
          training_name?: string | null
          training_provider?: string | null
          training_url?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          feedback?: string | null
          id?: string
          justification?: string
          manager_approved_at?: string | null
          manager_id?: string | null
          manager_notes?: string | null
          organization_id?: string
          pdi_goal_id?: string | null
          people_approved_at?: string | null
          people_approved_by?: string | null
          people_notes?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_request_status"]
          submitted_at?: string | null
          training_description?: string | null
          training_id?: string | null
          training_name?: string | null
          training_provider?: string | null
          training_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_pdi_goal_id_fkey"
            columns: ["pdi_goal_id"]
            isOneToOne: false
            referencedRelation: "pdi_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_people_approved_by_fkey"
            columns: ["people_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_requests_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          state: string
          updated_at: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          state: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          state?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      employees_legal_docs_masked: {
        Row: {
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          cpf: string | null
          created_at: string | null
          pix_key: string | null
          rg: string | null
          rg_issuer: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account?: never
          bank_account_type?: string | null
          bank_agency?: never
          bank_name?: string | null
          cpf?: never
          created_at?: string | null
          pix_key?: never
          rg?: never
          rg_issuer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account?: never
          bank_account_type?: string | null
          bank_agency?: never
          bank_name?: string | null
          cpf?: never
          created_at?: string | null
          pix_key?: never
          rg?: never
          rg_issuer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs_public: {
        Row: {
          application_deadline: string | null
          benefits: string[] | null
          contract_type: string | null
          created_at: string | null
          description: string | null
          desired_skills: string[] | null
          education_level: string | null
          expected_start_date: string | null
          experience_years: number | null
          id: string | null
          languages: Json | null
          openings_count: number | null
          organization_id: string | null
          require_cover_letter: boolean | null
          required_skills: string[] | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          salary_type: string | null
          seniority: string | null
          tags: string[] | null
          title: string | null
          unit_city: string | null
          unit_name: string | null
          unit_state: string | null
          work_model: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_public: {
        Row: {
          benefits: Json | null
          description: string | null
          employee_count: string | null
          headquarters_city: string | null
          hiring_process_description: string | null
          hiring_time: string | null
          id: string | null
          industry: string | null
          instagram_handle: string | null
          interview_format: string | null
          is_active: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
          twitter_handle: string | null
          website: string | null
          work_environment: string | null
          work_policy: string | null
        }
        Insert: {
          benefits?: Json | null
          description?: string | null
          employee_count?: string | null
          headquarters_city?: string | null
          hiring_process_description?: string | null
          hiring_time?: string | null
          id?: string | null
          industry?: string | null
          instagram_handle?: string | null
          interview_format?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          twitter_handle?: string | null
          website?: string | null
          work_environment?: string | null
          work_policy?: string | null
        }
        Update: {
          benefits?: Json | null
          description?: string | null
          employee_count?: string | null
          headquarters_city?: string | null
          hiring_process_description?: string | null
          hiring_time?: string | null
          id?: string | null
          industry?: string | null
          instagram_handle?: string | null
          interview_format?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          twitter_handle?: string | null
          website?: string | null
          work_environment?: string | null
          work_policy?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_critical_integrations: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_org_integrations: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      check_rate_limit:
        | {
            Args: {
              p_function_name: string
              p_key: string
              p_max_requests: number
              p_window_seconds: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_action: string
              p_ip_address: unknown
              p_limit: number
              p_window_seconds: number
            }
            Returns: Json
          }
      cleanup_rate_limit_log: { Args: never; Returns: undefined }
      count_org_admins: { Args: { _org_id: string }; Returns: number }
      create_employee_for_org: {
        Args: {
          _email: string
          _full_name?: string
          _org_id: string
          _user_id: string
        }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          _description?: string
          _employee_count?: string
          _industry?: string
          _name: string
          _slug: string
        }
        Returns: string
      }
      ensure_invite_org_member: { Args: never; Returns: Json }
      get_org_user_permissions: {
        Args: { _org_id: string; _user_id: string }
        Returns: {
          action: string
          module: string
          permission_id: string
        }[]
      }
      get_organization_public: {
        Args: { org_slug: string }
        Returns: {
          benefits: Json
          description: string
          employee_count: string
          headquarters_city: string
          hiring_process_description: string
          hiring_time: string
          id: string
          industry: string
          instagram_handle: string
          interview_format: string
          linkedin_url: string
          logo_url: string
          name: string
          slug: string
          team_structure: string
          tech_stack: string
          twitter_handle: string
          website: string
          work_environment: string
          work_policy: string
        }[]
      }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      has_any_organization: { Args: never; Returns: boolean }
      has_org_permission: {
        Args: { _org_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { _org_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      insert_audit_log: {
        Args: {
          p_action: string
          p_changes?: Json
          p_ip_address?: unknown
          p_is_sensitive?: boolean
          p_resource_id: string
          p_resource_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      is_same_org: { Args: { _org_id: string }; Returns: boolean }
      user_belongs_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_org_role_slug: {
        Args: { _slug: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_analysis_status:
        | "not_requested"
        | "pending"
        | "processing"
        | "completed"
        | "error"
      bonus_status: "pending" | "approved" | "paid" | "cancelled"
      bonus_type:
        | "performance"
        | "signing"
        | "retention"
        | "referral"
        | "project"
        | "holiday"
        | "profit_sharing"
        | "other"
      candidate_stage:
        | "selecao"
        | "fit_cultural"
        | "fit_tecnico"
        | "pre_admissao"
        | "banco_talentos"
        | "rejeitado"
        | "contratado"
      contract_type: "clt" | "pj" | "internship" | "temporary" | "other"
      device_status:
        | "borrowed"
        | "available"
        | "office"
        | "defective"
        | "returned"
        | "not_found"
        | "maintenance"
        | "pending_format"
        | "pending_return"
        | "sold"
        | "donated"
      device_type:
        | "computer"
        | "monitor"
        | "mouse"
        | "keyboard"
        | "headset"
        | "webcam"
        | "phone"
        | "tablet"
        | "apple_tv"
        | "chromecast"
        | "cable"
        | "charger"
        | "other"
      education_level:
        | "elementary"
        | "high_school"
        | "technical"
        | "undergraduate"
        | "postgraduate"
        | "masters"
        | "doctorate"
        | "postdoc"
      employee_status: "pending" | "active" | "on_leave" | "terminated"
      employment_type: "full_time" | "part_time" | "contractor" | "intern"
      equity_status:
        | "granted"
        | "vesting"
        | "vested"
        | "exercised"
        | "expired"
        | "cancelled"
      equity_type: "stock_option" | "rsu" | "phantom" | "partnership" | "other"
      ethnicity:
        | "white"
        | "black"
        | "brown"
        | "asian"
        | "indigenous"
        | "not_declared"
      feedback_type: "positive" | "neutral" | "negative"
      gender: "male" | "female" | "non_binary" | "prefer_not_to_say"
      job_status: "active" | "closed" | "draft" | "on_hold"
      marital_status:
        | "single"
        | "married"
        | "divorced"
        | "widowed"
        | "domestic_partnership"
        | "prefer_not_to_say"
      pdi_goal_status: "pendente" | "em_andamento" | "concluida"
      pdi_goal_type: "tecnico" | "comportamental" | "lideranca" | "carreira"
      pdi_status:
        | "rascunho"
        | "em_andamento"
        | "entregue"
        | "concluido"
        | "cancelado"
      position_level:
        | "junior"
        | "mid"
        | "senior"
        | "lead"
        | "manager"
        | "director"
        | "executive"
      position_level_detail:
        | "junior_i"
        | "junior_ii"
        | "junior_iii"
        | "pleno_i"
        | "pleno_ii"
        | "pleno_iii"
        | "senior_i"
        | "senior_ii"
        | "senior_iii"
      seniority_level:
        | "estagiario"
        | "junior"
        | "pleno"
        | "senior"
        | "especialista"
        | "lider"
      termination_cause:
        | "recebimento_proposta"
        | "baixo_desempenho"
        | "corte_custos"
        | "relocacao"
        | "insatisfacao"
        | "problemas_pessoais"
        | "outros"
        | "reestruturacao"
      termination_decision: "pediu_pra_sair" | "foi_demitido"
      termination_reason:
        | "pedido_demissao"
        | "sem_justa_causa"
        | "justa_causa"
        | "antecipada_termo_empregador"
        | "fim_contrato"
        | "acordo_mutuo"
        | "outros"
        | "rescisao_indireta"
        | "antecipada_termo_empregado"
        | "aposentadoria_idade"
        | "aposentadoria_invalidez"
        | "aposentadoria_compulsoria"
        | "falecimento"
        | "forca_maior"
      time_off_status: "pending_people" | "approved" | "rejected" | "cancelled"
      training_request_status:
        | "draft"
        | "pending_manager"
        | "pending_people"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
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
    Enums: {
      ai_analysis_status: [
        "not_requested",
        "pending",
        "processing",
        "completed",
        "error",
      ],
      bonus_status: ["pending", "approved", "paid", "cancelled"],
      bonus_type: [
        "performance",
        "signing",
        "retention",
        "referral",
        "project",
        "holiday",
        "profit_sharing",
        "other",
      ],
      candidate_stage: [
        "selecao",
        "fit_cultural",
        "fit_tecnico",
        "pre_admissao",
        "banco_talentos",
        "rejeitado",
        "contratado",
      ],
      contract_type: ["clt", "pj", "internship", "temporary", "other"],
      device_status: [
        "borrowed",
        "available",
        "office",
        "defective",
        "returned",
        "not_found",
        "maintenance",
        "pending_format",
        "pending_return",
        "sold",
        "donated",
      ],
      device_type: [
        "computer",
        "monitor",
        "mouse",
        "keyboard",
        "headset",
        "webcam",
        "phone",
        "tablet",
        "apple_tv",
        "chromecast",
        "cable",
        "charger",
        "other",
      ],
      education_level: [
        "elementary",
        "high_school",
        "technical",
        "undergraduate",
        "postgraduate",
        "masters",
        "doctorate",
        "postdoc",
      ],
      employee_status: ["pending", "active", "on_leave", "terminated"],
      employment_type: ["full_time", "part_time", "contractor", "intern"],
      equity_status: [
        "granted",
        "vesting",
        "vested",
        "exercised",
        "expired",
        "cancelled",
      ],
      equity_type: ["stock_option", "rsu", "phantom", "partnership", "other"],
      ethnicity: [
        "white",
        "black",
        "brown",
        "asian",
        "indigenous",
        "not_declared",
      ],
      feedback_type: ["positive", "neutral", "negative"],
      gender: ["male", "female", "non_binary", "prefer_not_to_say"],
      job_status: ["active", "closed", "draft", "on_hold"],
      marital_status: [
        "single",
        "married",
        "divorced",
        "widowed",
        "domestic_partnership",
        "prefer_not_to_say",
      ],
      pdi_goal_status: ["pendente", "em_andamento", "concluida"],
      pdi_goal_type: ["tecnico", "comportamental", "lideranca", "carreira"],
      pdi_status: [
        "rascunho",
        "em_andamento",
        "entregue",
        "concluido",
        "cancelado",
      ],
      position_level: [
        "junior",
        "mid",
        "senior",
        "lead",
        "manager",
        "director",
        "executive",
      ],
      position_level_detail: [
        "junior_i",
        "junior_ii",
        "junior_iii",
        "pleno_i",
        "pleno_ii",
        "pleno_iii",
        "senior_i",
        "senior_ii",
        "senior_iii",
      ],
      seniority_level: [
        "estagiario",
        "junior",
        "pleno",
        "senior",
        "especialista",
        "lider",
      ],
      termination_cause: [
        "recebimento_proposta",
        "baixo_desempenho",
        "corte_custos",
        "relocacao",
        "insatisfacao",
        "problemas_pessoais",
        "outros",
        "reestruturacao",
      ],
      termination_decision: ["pediu_pra_sair", "foi_demitido"],
      termination_reason: [
        "pedido_demissao",
        "sem_justa_causa",
        "justa_causa",
        "antecipada_termo_empregador",
        "fim_contrato",
        "acordo_mutuo",
        "outros",
        "rescisao_indireta",
        "antecipada_termo_empregado",
        "aposentadoria_idade",
        "aposentadoria_invalidez",
        "aposentadoria_compulsoria",
        "falecimento",
        "forca_maior",
      ],
      time_off_status: ["pending_people", "approved", "rejected", "cancelled"],
      training_request_status: [
        "draft",
        "pending_manager",
        "pending_people",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
