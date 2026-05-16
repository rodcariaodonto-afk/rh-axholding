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
      absenteeism: {
        Row: {
          cid_code: string | null
          created_at: string
          date: string
          doctor_name: string | null
          document_name: string | null
          document_url: string | null
          employee_id: string
          end_time: string | null
          id: string
          inss_end_date: string | null
          inss_protocol: string | null
          inss_start_date: string | null
          minutes_lost: number | null
          organization_id: string
          reason: string | null
          registered_by: string | null
          start_time: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          cid_code?: string | null
          created_at?: string
          date: string
          doctor_name?: string | null
          document_name?: string | null
          document_url?: string | null
          employee_id: string
          end_time?: string | null
          id?: string
          inss_end_date?: string | null
          inss_protocol?: string | null
          inss_start_date?: string | null
          minutes_lost?: number | null
          organization_id: string
          reason?: string | null
          registered_by?: string | null
          start_time?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          cid_code?: string | null
          created_at?: string
          date?: string
          doctor_name?: string | null
          document_name?: string | null
          document_url?: string | null
          employee_id?: string
          end_time?: string | null
          id?: string
          inss_end_date?: string | null
          inss_protocol?: string | null
          inss_start_date?: string | null
          minutes_lost?: number | null
          organization_id?: string
          reason?: string | null
          registered_by?: string | null
          start_time?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absenteeism_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absenteeism_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absenteeism_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_checklist_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          done_at: string | null
          done_by: string | null
          id: string
          process_id: string
          required: boolean
          status: Database["public"]["Enums"]["admission_checklist_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          done_at?: string | null
          done_by?: string | null
          id?: string
          process_id: string
          required?: boolean
          status?: Database["public"]["Enums"]["admission_checklist_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          done_at?: string | null
          done_by?: string | null
          id?: string
          process_id?: string
          required?: boolean
          status?: Database["public"]["Enums"]["admission_checklist_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_checklist_items_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "admission_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_documents: {
        Row: {
          created_at: string
          doc_label: string
          doc_type: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          process_id: string
          required: boolean
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["admission_doc_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_label: string
          doc_type: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          process_id: string
          required?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["admission_doc_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_label?: string
          doc_type?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          process_id?: string
          required?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["admission_doc_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "admission_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json
          process_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          process_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "admission_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_form_data: {
        Row: {
          created_at: string
          id: string
          payload: Json
          process_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          process_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          process_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_form_data_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: true
            referencedRelation: "admission_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_processes: {
        Row: {
          base_position_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          candidate_email: string
          candidate_id: string | null
          candidate_name: string
          candidate_phone: string | null
          completed_at: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          employee_id: string | null
          expected_start_date: string | null
          id: string
          invite_expires_at: string | null
          invite_sent_at: string | null
          invite_token: string | null
          manager_id: string | null
          notes: string | null
          organization_id: string
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["admission_status"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          base_position_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          candidate_email: string
          candidate_id?: string | null
          candidate_name: string
          candidate_phone?: string | null
          completed_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employee_id?: string | null
          expected_start_date?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          manager_id?: string | null
          notes?: string | null
          organization_id: string
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["admission_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          base_position_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          candidate_email?: string
          candidate_id?: string | null
          candidate_name?: string
          candidate_phone?: string | null
          completed_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employee_id?: string | null
          expected_start_date?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          manager_id?: string | null
          notes?: string | null
          organization_id?: string
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["admission_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_processes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: unknown
          is_sensitive: boolean
          new_values: Json | null
          organization_id: string | null
          previous_values: Json | null
          resource_id: string | null
          resource_type: string
          severity: string
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
          new_values?: Json | null
          organization_id?: string | null
          previous_values?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string
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
          new_values?: Json | null
          organization_id?: string | null
          previous_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string
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
      auditoria_ponto: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: Json | null
          hash_atual: string | null
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: Json | null
          hash_atual?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: Json | null
          hash_atual?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_ponto_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_ponto_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_ponto_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_leads: {
        Row: {
          cargo: string
          created_at: string | null
          email: string
          empresa: string
          id: string
          mensagem: string | null
          nome: string
          num_funcionarios: string
          origem: string | null
          telefone: string | null
        }
        Insert: {
          cargo: string
          created_at?: string | null
          email: string
          empresa: string
          id?: string
          mensagem?: string | null
          nome: string
          num_funcionarios: string
          origem?: string | null
          telefone?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string | null
          email?: string
          empresa?: string
          id?: string
          mensagem?: string | null
          nome?: string
          num_funcionarios?: string
          origem?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      banco_horas_registros: {
        Row: {
          banco_horas_acumulado_minutos: number | null
          created_at: string
          data: string
          diferenca_minutos: number | null
          employee_id: string
          entrada: string | null
          horas_esperadas: number
          horas_extras_minutos: number | null
          horas_trabalhadas_minutos: number | null
          id: string
          intervalo_minutos: number | null
          lunch_out: string | null
          lunch_return: string | null
          observacoes: string | null
          organization_id: string
          saida: string | null
          tipo_jornada: string | null
          tipo_registro: string
          updated_at: string
        }
        Insert: {
          banco_horas_acumulado_minutos?: number | null
          created_at?: string
          data: string
          diferenca_minutos?: number | null
          employee_id: string
          entrada?: string | null
          horas_esperadas?: number
          horas_extras_minutos?: number | null
          horas_trabalhadas_minutos?: number | null
          id?: string
          intervalo_minutos?: number | null
          lunch_out?: string | null
          lunch_return?: string | null
          observacoes?: string | null
          organization_id: string
          saida?: string | null
          tipo_jornada?: string | null
          tipo_registro?: string
          updated_at?: string
        }
        Update: {
          banco_horas_acumulado_minutos?: number | null
          created_at?: string
          data?: string
          diferenca_minutos?: number | null
          employee_id?: string
          entrada?: string | null
          horas_esperadas?: number
          horas_extras_minutos?: number | null
          horas_trabalhadas_minutos?: number | null
          id?: string
          intervalo_minutos?: number | null
          lunch_out?: string | null
          lunch_return?: string | null
          observacoes?: string | null
          organization_id?: string
          saida?: string | null
          tipo_jornada?: string | null
          tipo_registro?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_horas_registros_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_horas_registros_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_horas_registros_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_horas_totalizadores: {
        Row: {
          ano: number
          atrasados: number | null
          banco_acumulado_anterior: number | null
          banco_acumulado_mes: number | null
          created_at: string
          employee_id: string
          entrada_feriado: number | null
          entrada_feriado_dias: number | null
          faltas: number | null
          horas_extras_positivas: number | null
          horas_presentes: number | null
          horas_trabalhadas_dias: number | null
          id: string
          mes: number
          organization_id: string
          saldo_atual: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          atrasados?: number | null
          banco_acumulado_anterior?: number | null
          banco_acumulado_mes?: number | null
          created_at?: string
          employee_id: string
          entrada_feriado?: number | null
          entrada_feriado_dias?: number | null
          faltas?: number | null
          horas_extras_positivas?: number | null
          horas_presentes?: number | null
          horas_trabalhadas_dias?: number | null
          id?: string
          mes: number
          organization_id: string
          saldo_atual?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          atrasados?: number | null
          banco_acumulado_anterior?: number | null
          banco_acumulado_mes?: number | null
          created_at?: string
          employee_id?: string
          entrada_feriado?: number | null
          entrada_feriado_dias?: number | null
          faltas?: number | null
          horas_extras_positivas?: number | null
          horas_presentes?: number | null
          horas_trabalhadas_dias?: number | null
          id?: string
          mes?: number
          organization_id?: string
          saldo_atual?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_horas_totalizadores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_horas_totalizadores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_horas_totalizadores_organization_id_fkey"
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
      candidate_interactions: {
        Row: {
          action: string
          candidate_id: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          action: string
          candidate_id: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          action?: string
          candidate_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_interactions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_at: string
          created_at: string
          email: string
          id: string
          job_id: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          resume_url: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          email: string
          id?: string
          job_id?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          resume_url?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          email?: string
          id?: string
          job_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          resume_url?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_organization_id_fkey"
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
      company_documents: {
        Row: {
          access_roles: string[] | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          organization_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
          valid_from: string | null
          valid_until: string | null
          version: string
          visibility: string
        }
        Insert: {
          access_roles?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          organization_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: string
          visibility?: string
        }
        Update: {
          access_roles?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_organization_id_fkey"
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
      cost_centers: {
        Row: {
          active: boolean
          address: Json | null
          cnpj: string | null
          code: string
          created_at: string
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          responsible_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: Json | null
          cnpj?: string | null
          code: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          responsible_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: Json | null
          cnpj?: string | null
          code?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          responsible_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_classifications: {
        Row: {
          classification: string
          classified_by: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          resource_id: string
          resource_type: string
          retention_until: string | null
          updated_at: string
        }
        Insert: {
          classification?: string
          classified_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          resource_id: string
          resource_type: string
          retention_until?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string
          classified_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          resource_id?: string
          resource_type?: string
          retention_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_classifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_classifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_consents: {
        Row: {
          ai_processing_allowed: boolean
          consent_given_at: string | null
          consent_revoked_at: string | null
          consent_source: string | null
          consent_status: string
          created_at: string
          data_origin: string | null
          id: string
          legal_basis: string
          organization_id: string
          privacy_notes: string | null
          purpose: string
          subject_id: string
          subject_type: string
          talent_pool_opt_in: boolean
          updated_at: string
        }
        Insert: {
          ai_processing_allowed?: boolean
          consent_given_at?: string | null
          consent_revoked_at?: string | null
          consent_source?: string | null
          consent_status?: string
          created_at?: string
          data_origin?: string | null
          id?: string
          legal_basis?: string
          organization_id: string
          privacy_notes?: string | null
          purpose: string
          subject_id: string
          subject_type: string
          talent_pool_opt_in?: boolean
          updated_at?: string
        }
        Update: {
          ai_processing_allowed?: boolean
          consent_given_at?: string | null
          consent_revoked_at?: string | null
          consent_source?: string | null
          consent_status?: string
          created_at?: string
          data_origin?: string | null
          id?: string
          legal_basis?: string
          organization_id?: string
          privacy_notes?: string | null
          purpose?: string
          subject_id?: string
          subject_type?: string
          talent_pool_opt_in?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_consents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_consents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          format: string
          id: string
          metadata: Json
          organization_id: string
          requested_by: string | null
          scope: string[]
          status: string
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          id?: string
          metadata?: Json
          organization_id: string
          requested_by?: string | null
          scope?: string[]
          status?: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          id?: string
          metadata?: Json
          organization_id?: string
          requested_by?: string | null
          scope?: string[]
          status?: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_governance_policies: {
        Row: {
          ai_recruitment_policy: string | null
          candidate_retention_days: number
          created_at: string
          data_classification_required: boolean
          document_access_logging: boolean
          document_retention_days: number
          dsr_response_sla_days: number
          export_link_ttl_days: number
          organization_id: string
          sensitive_export_requires_2fa: boolean
          terminated_employee_retention_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_recruitment_policy?: string | null
          candidate_retention_days?: number
          created_at?: string
          data_classification_required?: boolean
          document_access_logging?: boolean
          document_retention_days?: number
          dsr_response_sla_days?: number
          export_link_ttl_days?: number
          organization_id: string
          sensitive_export_requires_2fa?: boolean
          terminated_employee_retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_recruitment_policy?: string | null
          candidate_retention_days?: number
          created_at?: string
          data_classification_required?: boolean
          document_access_logging?: boolean
          document_retention_days?: number
          dsr_response_sla_days?: number
          export_link_ttl_days?: number
          organization_id?: string
          sensitive_export_requires_2fa?: boolean
          terminated_employee_retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_governance_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_governance_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subject_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_at: string | null
          history: Json
          id: string
          organization_id: string
          priority: string
          request_id: string | null
          request_kind: string
          resolution_notes: string | null
          status: string
          subject_email: string | null
          subject_id: string | null
          subject_name: string | null
          subject_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_at?: string | null
          history?: Json
          id?: string
          organization_id: string
          priority?: string
          request_id?: string | null
          request_kind: string
          resolution_notes?: string | null
          status?: string
          subject_email?: string | null
          subject_id?: string | null
          subject_name?: string | null
          subject_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_at?: string | null
          history?: Json
          id?: string
          organization_id?: string
          priority?: string
          request_id?: string | null
          request_kind?: string
          resolution_notes?: string | null
          status?: string
          subject_email?: string | null
          subject_id?: string | null
          subject_name?: string | null
          subject_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_subject_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_subject_requests_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "lgpd_requests"
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
      document_templates: {
        Row: {
          body_html: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          name: string
          organization_id: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_html?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          name: string
          organization_id: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_html?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["document_kind"]
          name?: string
          organization_id?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
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
          expires_at: string | null
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
          expires_at?: string | null
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
          expires_at?: string | null
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
      employee_journey_config: {
        Row: {
          compensacao_automatica: boolean
          created_at: string
          data_termino: string | null
          data_vigencia: string
          dias_trabalho: string[]
          employee_id: string
          fator_domingo: number
          fator_feriado: number
          fator_hora_extra_normal: number
          fator_hora_extra_noturna: number
          fator_sabado: number
          horas_dia: number
          horas_semana: number
          id: string
          intervalo_padrao: number
          is_active: boolean
          limite_saldo_negativo: number
          observacoes: string | null
          organization_id: string
          tipo_jornada: string
          tolerancia_atraso: number
          tolerancia_saida_antecipada: number
          updated_at: string
          validade_horas_dias: number
        }
        Insert: {
          compensacao_automatica?: boolean
          created_at?: string
          data_termino?: string | null
          data_vigencia?: string
          dias_trabalho?: string[]
          employee_id: string
          fator_domingo?: number
          fator_feriado?: number
          fator_hora_extra_normal?: number
          fator_hora_extra_noturna?: number
          fator_sabado?: number
          horas_dia?: number
          horas_semana?: number
          id?: string
          intervalo_padrao?: number
          is_active?: boolean
          limite_saldo_negativo?: number
          observacoes?: string | null
          organization_id: string
          tipo_jornada?: string
          tolerancia_atraso?: number
          tolerancia_saida_antecipada?: number
          updated_at?: string
          validade_horas_dias?: number
        }
        Update: {
          compensacao_automatica?: boolean
          created_at?: string
          data_termino?: string | null
          data_vigencia?: string
          dias_trabalho?: string[]
          employee_id?: string
          fator_domingo?: number
          fator_feriado?: number
          fator_hora_extra_normal?: number
          fator_hora_extra_noturna?: number
          fator_sabado?: number
          horas_dia?: number
          horas_semana?: number
          id?: string
          intervalo_padrao?: number
          is_active?: boolean
          limite_saldo_negativo?: number
          observacoes?: string | null
          organization_id?: string
          tipo_jornada?: string
          tolerancia_atraso?: number
          tolerancia_saida_antecipada?: number
          updated_at?: string
          validade_horas_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_journey_config_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_journey_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_journey_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          catalog_item_id: string | null
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
          request_status: string | null
          sponsor: string
          training_type: string
          updated_at: string
        }
        Insert: {
          career_points?: number | null
          catalog_item_id?: string | null
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
          request_status?: string | null
          sponsor?: string
          training_type?: string
          updated_at?: string
        }
        Update: {
          career_points?: number | null
          catalog_item_id?: string | null
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
          request_status?: string | null
          sponsor?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "training_catalog"
            referencedColumns: ["id"]
          },
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
          cbo_code: string | null
          cpf: string | null
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
          weekly_hours: number | null
          work_policy_id: string | null
          work_schedule_id: string | null
        }
        Insert: {
          base_position_id?: string | null
          birth_date?: string | null
          birthplace?: string | null
          cbo_code?: string | null
          cpf?: string | null
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
          weekly_hours?: number | null
          work_policy_id?: string | null
          work_schedule_id?: string | null
        }
        Update: {
          base_position_id?: string | null
          birth_date?: string | null
          birthplace?: string | null
          cbo_code?: string | null
          cpf?: string | null
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
          weekly_hours?: number | null
          work_policy_id?: string | null
          work_schedule_id?: string | null
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
          {
            foreignKeyName: "employees_work_policy_id_fkey"
            columns: ["work_policy_id"]
            isOneToOne: false
            referencedRelation: "work_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
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
          corporate_email: string | null
          corporate_phone: string | null
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
          personal_phone: string | null
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
          corporate_email?: string | null
          corporate_phone?: string | null
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
          personal_phone?: string | null
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
          corporate_email?: string | null
          corporate_phone?: string | null
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
          personal_phone?: string | null
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
          document_url: string | null
          health_insurance: number | null
          hire_date: string
          id: string
          is_active: boolean
          meal_voucher: number | null
          modified_by: string | null
          other_benefits: number | null
          probation_days: number | null
          signed_at: string | null
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
          document_url?: string | null
          health_insurance?: number | null
          hire_date: string
          id?: string
          is_active?: boolean
          meal_voucher?: number | null
          modified_by?: string | null
          other_benefits?: number | null
          probation_days?: number | null
          signed_at?: string | null
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
          document_url?: string | null
          health_insurance?: number | null
          hire_date?: string
          id?: string
          is_active?: boolean
          meal_voucher?: number | null
          modified_by?: string | null
          other_benefits?: number | null
          probation_days?: number | null
          signed_at?: string | null
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
      export_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          expires_at: string | null
          finished_at: string | null
          id: string
          job_type: Database["public"]["Enums"]["export_job_type"]
          organization_id: string
          params: Json
          requested_by: string
          result_mime: string | null
          result_path: string | null
          result_size_bytes: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["export_job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          finished_at?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["export_job_type"]
          organization_id: string
          params?: Json
          requested_by: string
          result_mime?: string | null
          result_path?: string | null
          result_size_bytes?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["export_job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          finished_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["export_job_type"]
          organization_id?: string
          params?: Json
          requested_by?: string
          result_mime?: string | null
          result_path?: string | null
          result_size_bytes?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["export_job_status"]
          updated_at?: string
        }
        Relationships: []
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
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number | null
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          organization_id: string
          period: string
          status: string
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          organization_id: string
          period?: string
          status?: string
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          organization_id?: string
          period?: string
          status?: string
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
      historico_saldo_banco_horas: {
        Row: {
          ano: number
          created_at: string
          employee_id: string
          horas_acumuladas_mes: number | null
          horas_compensadas: number | null
          id: string
          mes: number
          organization_id: string
          saldo_anterior: number | null
          saldo_atual: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          employee_id: string
          horas_acumuladas_mes?: number | null
          horas_compensadas?: number | null
          id?: string
          mes: number
          organization_id: string
          saldo_anterior?: number | null
          saldo_atual?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          employee_id?: string
          horas_acumuladas_mes?: number | null
          horas_compensadas?: number | null
          id?: string
          mes?: number
          organization_id?: string
          saldo_anterior?: number | null
          saldo_atual?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_saldo_banco_horas_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_saldo_banco_horas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_saldo_banco_horas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_documents: {
        Row: {
          competency_id: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          file_mime: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          metadata: Json | null
          organization_id: string
          requires_signature: boolean
          signature_envelope_id: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          file_mime?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          kind: Database["public"]["Enums"]["document_kind"]
          metadata?: Json | null
          organization_id: string
          requires_signature?: boolean
          signature_envelope_id?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          file_mime?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          metadata?: Json | null
          organization_id?: string
          requires_signature?: boolean
          signature_envelope_id?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_documents_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "payroll_competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_signature_envelope_fkey"
            columns: ["signature_envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          error_rows: number
          file_name: string
          id: string
          organization_id: string
          success_rows: number
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          error_rows?: number
          file_name: string
          id?: string
          organization_id: string
          success_rows?: number
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          error_rows?: number
          file_name?: string
          id?: string
          organization_id?: string
          success_rows?: number
          total_rows?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_organization_id_fkey"
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
      justificativas_ponto: {
        Row: {
          aprovado_por: string | null
          arquivo_url: string | null
          created_at: string
          data_aprovacao: string | null
          data_envio: string | null
          data_evento: string
          data_rejeicao: string | null
          descricao_evento: string | null
          descricao_justificativa: string | null
          duracao_minutos: number | null
          employee_id: string
          horario_evento: string | null
          id: string
          motivo: string | null
          motivo_rejeicao: string | null
          organization_id: string
          status: string
          tipo_documento: string | null
          tipo_registro: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_envio?: string | null
          data_evento: string
          data_rejeicao?: string | null
          descricao_evento?: string | null
          descricao_justificativa?: string | null
          duracao_minutos?: number | null
          employee_id: string
          horario_evento?: string | null
          id?: string
          motivo?: string | null
          motivo_rejeicao?: string | null
          organization_id: string
          status?: string
          tipo_documento?: string | null
          tipo_registro: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_envio?: string | null
          data_evento?: string
          data_rejeicao?: string | null
          descricao_evento?: string | null
          descricao_justificativa?: string | null
          duracao_minutos?: number | null
          employee_id?: string
          horario_evento?: string | null
          id?: string
          motivo?: string | null
          motivo_rejeicao?: string | null
          organization_id?: string
          status?: string
          tipo_documento?: string | null
          tipo_registro?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_ponto_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_ponto_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_ponto_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_ponto_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_entities: {
        Row: {
          active: boolean
          address: Json | null
          cnae_code: string | null
          cnpj: string
          created_at: string
          id: string
          legal_name: string
          metadata: Json | null
          municipal_registration: string | null
          organization_id: string
          state_registration: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: Json | null
          cnae_code?: string | null
          cnpj: string
          created_at?: string
          id?: string
          legal_name: string
          metadata?: Json | null
          municipal_registration?: string | null
          organization_id: string
          state_registration?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: Json | null
          cnae_code?: string | null
          cnpj?: string
          created_at?: string
          id?: string
          legal_name?: string
          metadata?: Json | null
          municipal_registration?: string | null
          organization_id?: string
          state_registration?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_requests: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          due_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          organization_id: string | null
          request_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          due_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          organization_id?: string | null
          request_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          due_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          organization_id?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_exam_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          exam_id: string | null
          id: string
          metadata: Json
          organization_id: string
          schedule_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          exam_id?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          schedule_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          exam_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_exam_events_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "medical_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exam_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exam_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exam_events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "medical_exam_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_exam_schedules: {
        Row: {
          clinic_address: string | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string
          created_by: string | null
          doctor_name: string | null
          employee_id: string
          exam_id: string | null
          exam_type: string
          id: string
          notes: string | null
          organization_id: string
          reminder_sent_at: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          created_by?: string | null
          doctor_name?: string | null
          employee_id: string
          exam_id?: string | null
          exam_type: string
          id?: string
          notes?: string | null
          organization_id: string
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          created_by?: string | null
          doctor_name?: string | null
          employee_id?: string
          exam_id?: string | null
          exam_type?: string
          id?: string
          notes?: string | null
          organization_id?: string
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_exam_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exam_schedules_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "medical_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exam_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exam_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_exams: {
        Row: {
          clinic_name: string | null
          created_at: string
          created_by: string | null
          doctor_crm: string | null
          doctor_name: string | null
          employee_id: string
          exam_date: string
          exam_type: string
          file_path: string | null
          id: string
          notes: string | null
          organization_id: string
          restrictions: string | null
          result: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          doctor_crm?: string | null
          doctor_name?: string | null
          employee_id: string
          exam_date: string
          exam_type: string
          file_path?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          restrictions?: string | null
          result?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          doctor_crm?: string | null
          doctor_name?: string | null
          employee_id?: string
          exam_date?: string
          exam_type?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          restrictions?: string | null
          result?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_exams_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          organization_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          organization_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_processes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          expected_completion_at: string | null
          id: string
          notes: string | null
          organization_id: string
          responsible_user_id: string | null
          started_at: string | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          expected_completion_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          responsible_user_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          expected_completion_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          responsible_user_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_processes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          document_id: string | null
          due_date: string | null
          employee_id: string
          id: string
          metadata: Json
          organization_id: string
          process_id: string
          required: boolean
          responsible_role: string
          sort_order: number
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          metadata?: Json
          organization_id: string
          process_id: string
          required?: boolean
          responsible_role?: string
          sort_order?: number
          status?: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          metadata?: Json
          organization_id?: string
          process_id?: string
          required?: boolean
          responsible_role?: string
          sort_order?: number
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hr_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "onboarding_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_template_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_offset_days: number
          id: string
          organization_id: string
          required: boolean
          responsible_role: string
          sort_order: number
          task_type: string
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_offset_days?: number
          id?: string
          organization_id: string
          required?: boolean
          responsible_role?: string
          sort_order?: number
          task_type: string
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_offset_days?: number
          id?: string
          organization_id?: string
          required?: boolean
          responsible_role?: string
          sort_order?: number
          task_type?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_template_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_template_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          position_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          position_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          position_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_templates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_calendar_days: {
        Row: {
          calendar_id: string
          counts_as_workday: boolean
          created_at: string
          day: string
          day_type: Database["public"]["Enums"]["calendar_day_type"]
          description: string | null
          id: string
          organization_id: string
          overtime_multiplier: number | null
        }
        Insert: {
          calendar_id: string
          counts_as_workday?: boolean
          created_at?: string
          day: string
          day_type: Database["public"]["Enums"]["calendar_day_type"]
          description?: string | null
          id?: string
          organization_id: string
          overtime_multiplier?: number | null
        }
        Update: {
          calendar_id?: string
          counts_as_workday?: boolean
          created_at?: string
          day?: string
          day_type?: Database["public"]["Enums"]["calendar_day_type"]
          description?: string | null
          id?: string
          organization_id?: string
          overtime_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_calendar_days_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "operational_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_calendar_days_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_calendar_days_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_calendars: {
        Row: {
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          legal_entity_id: string | null
          name: string
          organization_id: string
          scope: Database["public"]["Enums"]["calendar_scope"]
          unit_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          legal_entity_id?: string | null
          name: string
          organization_id: string
          scope?: Database["public"]["Enums"]["calendar_scope"]
          unit_id?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          legal_entity_id?: string | null
          name?: string
          organization_id?: string
          scope?: Database["public"]["Enums"]["calendar_scope"]
          unit_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "operational_calendars_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_calendars_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "legal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_calendars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_calendars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          address: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          latitude: number
          legal_entity_id: string | null
          longitude: number
          name: string
          organization_id: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          latitude: number
          legal_entity_id?: string | null
          longitude: number
          name: string
          organization_id: string
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          latitude?: number
          legal_entity_id?: string | null
          longitude?: number
          name?: string
          organization_id?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_locations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "legal_entities"
            referencedColumns: ["id"]
          },
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
      organization_modules: {
        Row: {
          enabled: boolean
          enabled_at: string
          enabled_by: string | null
          id: string
          module_key: string
          organization_id: string
        }
        Insert: {
          enabled?: boolean
          enabled_at?: string
          enabled_by?: string | null
          id?: string
          module_key: string
          organization_id: string
        }
        Update: {
          enabled?: boolean
          enabled_at?: string
          enabled_by?: string | null
          id?: string
          module_key?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          internal_notes: string | null
          interview_format: string | null
          invite_from_email: string | null
          invite_from_name: string | null
          is_active: boolean | null
          is_internal: boolean
          last_access_at: string | null
          linkedin_url: string | null
          logo_url: string | null
          max_employees: number | null
          name: string
          plan_id: string | null
          plan_type: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_phone: string | null
          scheduled_deletion_at: string | null
          settings: Json | null
          slug: string
          status: string
          suspended_at: string | null
          team_structure: string | null
          tech_stack: string | null
          trial_ends_at: string | null
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
          internal_notes?: string | null
          interview_format?: string | null
          invite_from_email?: string | null
          invite_from_name?: string | null
          is_active?: boolean | null
          is_internal?: boolean
          last_access_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          max_employees?: number | null
          name: string
          plan_id?: string | null
          plan_type?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          scheduled_deletion_at?: string | null
          settings?: Json | null
          slug: string
          status?: string
          suspended_at?: string | null
          team_structure?: string | null
          tech_stack?: string | null
          trial_ends_at?: string | null
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
          internal_notes?: string | null
          interview_format?: string | null
          invite_from_email?: string | null
          invite_from_name?: string | null
          is_active?: boolean | null
          is_internal?: boolean
          last_access_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          max_employees?: number | null
          name?: string
          plan_id?: string | null
          plan_type?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          scheduled_deletion_at?: string | null
          settings?: Json | null
          slug?: string
          status?: string
          suspended_at?: string | null
          team_structure?: string | null
          tech_stack?: string | null
          trial_ends_at?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
          work_environment?: string | null
          work_policy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedule: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          employee_id: string
          id: string
          organization_id: string
          paid_at: string | null
          payment_date: string
          payment_method: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          employee_id: string
          id?: string
          organization_id: string
          paid_at?: string | null
          payment_date: string
          payment_method?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          employee_id?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_date?: string
          payment_method?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_competencies: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          month: number
          notes: string | null
          opened_at: string
          organization_id: string
          paid_at: string | null
          reference_label: string | null
          status: Database["public"]["Enums"]["payroll_competency_status"]
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          opened_at?: string
          organization_id: string
          paid_at?: string | null
          reference_label?: string | null
          status?: Database["public"]["Enums"]["payroll_competency_status"]
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          opened_at?: string
          organization_id?: string
          paid_at?: string | null
          reference_label?: string | null
          status?: Database["public"]["Enums"]["payroll_competency_status"]
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      payroll_events: {
        Row: {
          amount: number
          code: string
          competency_id: string
          created_at: string
          created_by: string | null
          description: string
          employee_id: string
          id: string
          kind: Database["public"]["Enums"]["payroll_event_kind"]
          metadata: Json | null
          organization_id: string
          reference: number | null
          source: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          code: string
          competency_id: string
          created_at?: string
          created_by?: string | null
          description: string
          employee_id: string
          id?: string
          kind: Database["public"]["Enums"]["payroll_event_kind"]
          metadata?: Json | null
          organization_id: string
          reference?: number | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          code?: string
          competency_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          employee_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["payroll_event_kind"]
          metadata?: Json | null
          organization_id?: string
          reference?: number | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_events_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "payroll_competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipt_batches: {
        Row: {
          ambiguous_count: number
          competency: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          matched_count: number
          organization_id: string
          published_at: string | null
          published_by: string | null
          receipt_type: Database["public"]["Enums"]["payroll_receipt_type"]
          status: Database["public"]["Enums"]["payroll_batch_status"]
          total_files: number
          unmatched_count: number
          updated_at: string
        }
        Insert: {
          ambiguous_count?: number
          competency: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          matched_count?: number
          organization_id: string
          published_at?: string | null
          published_by?: string | null
          receipt_type: Database["public"]["Enums"]["payroll_receipt_type"]
          status?: Database["public"]["Enums"]["payroll_batch_status"]
          total_files?: number
          unmatched_count?: number
          updated_at?: string
        }
        Update: {
          ambiguous_count?: number
          competency?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          matched_count?: number
          organization_id?: string
          published_at?: string | null
          published_by?: string | null
          receipt_type?: Database["public"]["Enums"]["payroll_receipt_type"]
          status?: Database["public"]["Enums"]["payroll_batch_status"]
          total_files?: number
          unmatched_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipt_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipt_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipt_events: {
        Row: {
          actor_user_id: string | null
          batch_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          organization_id: string
          receipt_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          batch_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          organization_id: string
          receipt_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          batch_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          receipt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipt_events_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payroll_receipt_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipt_events_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "payroll_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_ip: unknown
          acknowledged_user_agent: string | null
          batch_id: string
          cpf_lookup: string | null
          created_at: string
          download_count: number
          employee_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          last_downloaded_at: string | null
          match_candidates: Json | null
          match_status: Database["public"]["Enums"]["payroll_match_status"]
          matricula_lookup: string | null
          organization_id: string
          published: boolean
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_ip?: unknown
          acknowledged_user_agent?: string | null
          batch_id: string
          cpf_lookup?: string | null
          created_at?: string
          download_count?: number
          employee_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          last_downloaded_at?: string | null
          match_candidates?: Json | null
          match_status?: Database["public"]["Enums"]["payroll_match_status"]
          matricula_lookup?: string | null
          organization_id: string
          published?: boolean
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_ip?: unknown
          acknowledged_user_agent?: string | null
          batch_id?: string
          cpf_lookup?: string | null
          created_at?: string
          download_count?: number
          employee_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          last_downloaded_at?: string | null
          match_candidates?: Json | null
          match_status?: Database["public"]["Enums"]["payroll_match_status"]
          matricula_lookup?: string | null
          organization_id?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payroll_receipt_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          ack_status: Database["public"]["Enums"]["payslip_ack_status"]
          acknowledged_at: string | null
          competency_id: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          file_path: string
          file_size_bytes: number | null
          gross_amount: number | null
          id: string
          net_amount: number | null
          organization_id: string
          published_at: string
          signature_envelope_id: string | null
          source: Database["public"]["Enums"]["payslip_source"]
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          ack_status?: Database["public"]["Enums"]["payslip_ack_status"]
          acknowledged_at?: string | null
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          file_path: string
          file_size_bytes?: number | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          organization_id: string
          published_at?: string
          signature_envelope_id?: string | null
          source?: Database["public"]["Enums"]["payslip_source"]
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          ack_status?: Database["public"]["Enums"]["payslip_ack_status"]
          acknowledged_at?: string | null
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          file_path?: string
          file_size_bytes?: number | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          organization_id?: string
          published_at?: string
          signature_envelope_id?: string | null
          source?: Database["public"]["Enums"]["payslip_source"]
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "payroll_competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_signature_envelope_id_fkey"
            columns: ["signature_envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_action_plans: {
        Row: {
          action: string
          created_at: string
          end_date: string | null
          goal_id: string | null
          id: string
          notes: string | null
          pdi_id: string
          responsible: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          end_date?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          pdi_id: string
          responsible: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          end_date?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          pdi_id?: string
          responsible?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_action_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "pdi_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_action_plans_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
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
      pdi_versions: {
        Row: {
          change_description: string | null
          changed_by: string
          created_at: string
          id: string
          pdi_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_description?: string | null
          changed_by: string
          created_at?: string
          id?: string
          pdi_id: string
          snapshot: Json
          version_number?: number
        }
        Update: {
          change_description?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          pdi_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdi_versions_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdis: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
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
          submitted_for_approval_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          submitted_for_approval_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          submitted_for_approval_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdis_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
      pending_tasks: {
        Row: {
          action_url: string | null
          assigned_to: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          metadata: Json | null
          module: string
          organization_id: string
          priority: Database["public"]["Enums"]["pending_task_priority"]
          related_resource_id: string | null
          related_resource_type: string | null
          status: Database["public"]["Enums"]["pending_task_status"]
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          module: string
          organization_id: string
          priority?: Database["public"]["Enums"]["pending_task_priority"]
          related_resource_id?: string | null
          related_resource_type?: string | null
          status?: Database["public"]["Enums"]["pending_task_status"]
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          module?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["pending_task_priority"]
          related_resource_id?: string | null
          related_resource_type?: string | null
          status?: Database["public"]["Enums"]["pending_task_status"]
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
      plans: {
        Row: {
          created_at: string
          default_modules: string[]
          description: string | null
          display_order: number
          features: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_modules?: string[]
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_modules?: string[]
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_audit_log: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          target_organization_id: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          target_organization_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          target_organization_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ponto_registros: {
        Row: {
          created_at: string | null
          distance_meters: number
          employee_id: string
          gps_accuracy: number | null
          gps_latitude: number
          gps_longitude: number
          hash_sha256: string
          id: string
          location_id: string
          metodo_registro: string | null
          organization_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          distance_meters: number
          employee_id: string
          gps_accuracy?: number | null
          gps_latitude: number
          gps_longitude: number
          hash_sha256: string
          id?: string
          location_id: string
          metodo_registro?: string | null
          organization_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          distance_meters?: number
          employee_id?: string
          gps_accuracy?: number | null
          gps_latitude?: number
          gps_longitude?: number
          hash_sha256?: string
          id?: string
          location_id?: string
          metodo_registro?: string | null
          organization_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_registros_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_registros_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "organization_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_registros_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_registros_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
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
      receipts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          amount: number | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          description: string
          employee_id: string
          file_path: string | null
          id: string
          item_description: string | null
          organization_id: string
          quantity: number | null
          receipt_type: string
          reference_competency: string | null
          signature_envelope_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          amount?: number | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          description: string
          employee_id: string
          file_path?: string | null
          id?: string
          item_description?: string | null
          organization_id: string
          quantity?: number | null
          receipt_type: string
          reference_competency?: string | null
          signature_envelope_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          amount?: number | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          description?: string
          employee_id?: string
          file_path?: string | null
          id?: string
          item_description?: string | null
          organization_id?: string
          quantity?: number | null
          receipt_type?: string
          reference_competency?: string | null
          signature_envelope_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_signature_envelope_id_fkey"
            columns: ["signature_envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_jobs: {
        Row: {
          action: string
          created_at: string
          executed_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          organization_id: string
          scheduled_for: string
          status: string
          target_id: string
          target_table: string
        }
        Insert: {
          action: string
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          scheduled_for?: string
          status?: string
          target_id: string
          target_table: string
        }
        Update: {
          action?: string
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          scheduled_for?: string
          status?: string
          target_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
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
      salary_ranges: {
        Row: {
          base_salary_max: number
          base_salary_min: number
          benefits_total: number
          created_at: string
          effective_from: string
          effective_until: string | null
          hazard_pct: number
          id: string
          night_shift_pct: number
          organization_id: string
          position_id: string | null
          seniority: string
          unhealthy_pct: number
          updated_at: string
        }
        Insert: {
          base_salary_max?: number
          base_salary_min?: number
          benefits_total?: number
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          hazard_pct?: number
          id?: string
          night_shift_pct?: number
          organization_id: string
          position_id?: string | null
          seniority?: string
          unhealthy_pct?: number
          updated_at?: string
        }
        Update: {
          base_salary_max?: number
          base_salary_min?: number
          benefits_total?: number
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          hazard_pct?: number
          id?: string
          night_shift_pct?: number
          organization_id?: string
          position_id?: string | null
          seniority?: string
          unhealthy_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_ranges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_ranges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_ranges_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_envelope_signers: {
        Row: {
          created_at: string
          email: string
          envelope_id: string
          full_name: string
          id: string
          organization_id: string
          provider_signer_id: string | null
          role: string | null
          signed_at: string | null
          signing_order: number | null
          signing_url: string | null
          status: Database["public"]["Enums"]["signer_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          envelope_id: string
          full_name: string
          id?: string
          organization_id: string
          provider_signer_id?: string | null
          role?: string | null
          signed_at?: string | null
          signing_order?: number | null
          signing_url?: string | null
          status?: Database["public"]["Enums"]["signer_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          envelope_id?: string
          full_name?: string
          id?: string
          organization_id?: string
          provider_signer_id?: string | null
          role?: string | null
          signed_at?: string | null
          signing_order?: number | null
          signing_url?: string | null
          status?: Database["public"]["Enums"]["signer_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_envelope_signers_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_envelopes: {
        Row: {
          created_at: string
          created_by: string | null
          deadline_at: string | null
          document_id: string | null
          finished_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          organization_id: string
          provider: Database["public"]["Enums"]["signature_provider"]
          provider_envelope_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["signature_envelope_status"]
          subject: string | null
          updated_at: string
          webhook_payload: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          document_id?: string | null
          finished_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          organization_id: string
          provider?: Database["public"]["Enums"]["signature_provider"]
          provider_envelope_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["signature_envelope_status"]
          subject?: string | null
          updated_at?: string
          webhook_payload?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          document_id?: string | null
          finished_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          organization_id?: string
          provider?: Database["public"]["Enums"]["signature_provider"]
          provider_envelope_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["signature_envelope_status"]
          subject?: string | null
          updated_at?: string
          webhook_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_envelopes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hr_documents"
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
      super_admin_sessions: {
        Row: {
          ended_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          reason: string | null
          started_at: string
          super_admin_user_id: string
          target_organization_id: string
          user_agent: string | null
        }
        Insert: {
          ended_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          started_at?: string
          super_admin_user_id: string
          target_organization_id: string
          user_agent?: string | null
        }
        Update: {
          ended_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          started_at?: string
          super_admin_user_id?: string
          target_organization_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_sessions_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_sessions_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_analysis: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string
          employee_id: string | null
          id: string
          impact: string | null
          organization_id: string
          quadrant: string
          related_action: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description: string
          employee_id?: string | null
          id?: string
          impact?: string | null
          organization_id: string
          quadrant: string
          related_action?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string
          employee_id?: string | null
          id?: string
          impact?: string | null
          organization_id?: string
          quadrant?: string
          related_action?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swot_analysis_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swot_analysis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swot_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swot_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_checklist_items: {
        Row: {
          created_at: string
          description: string | null
          done_at: string | null
          done_by: string | null
          id: string
          process_id: string
          required: boolean
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          done_at?: string | null
          done_by?: string | null
          id?: string
          process_id: string
          required?: boolean
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          done_at?: string | null
          done_by?: string | null
          id?: string
          process_id?: string
          required?: boolean
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "termination_checklist_items_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "termination_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_details: {
        Row: {
          created_at: string
          employee_id: string
          fgts_balance: number | null
          fgts_penalty_amount: number | null
          fgts_penalty_pct: number | null
          id: string
          notes: string | null
          notice_amount: number | null
          notice_days: number | null
          notice_type: string | null
          organization_id: string
          other_credits: number | null
          other_debits: number | null
          pending_vacation_days: number | null
          proportional_13th_months: number | null
          proportional_vacation_days: number | null
          term_generated_at: string | null
          thirteenth_amount: number | null
          total_amount: number | null
          updated_at: string
          vacation_amount: number | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          fgts_balance?: number | null
          fgts_penalty_amount?: number | null
          fgts_penalty_pct?: number | null
          id?: string
          notes?: string | null
          notice_amount?: number | null
          notice_days?: number | null
          notice_type?: string | null
          organization_id: string
          other_credits?: number | null
          other_debits?: number | null
          pending_vacation_days?: number | null
          proportional_13th_months?: number | null
          proportional_vacation_days?: number | null
          term_generated_at?: string | null
          thirteenth_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          vacation_amount?: number | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          fgts_balance?: number | null
          fgts_penalty_amount?: number | null
          fgts_penalty_pct?: number | null
          id?: string
          notes?: string | null
          notice_amount?: number | null
          notice_days?: number | null
          notice_type?: string | null
          organization_id?: string
          other_credits?: number | null
          other_debits?: number | null
          pending_vacation_days?: number | null
          proportional_13th_months?: number | null
          proportional_vacation_days?: number | null
          term_generated_at?: string | null
          thirteenth_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          vacation_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "termination_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_details_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_details_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          process_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          process_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "termination_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "termination_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_processes: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          exam_id: string | null
          exam_schedule_id: string | null
          id: string
          notes: string | null
          notice_end_date: string | null
          notice_start_date: string | null
          notice_type: string | null
          organization_id: string
          responsible_user_id: string | null
          signature_envelope_id: string | null
          status: string
          termination_cause: string | null
          termination_date: string | null
          termination_decision: string | null
          termination_details_id: string | null
          termination_reason: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          exam_id?: string | null
          exam_schedule_id?: string | null
          id?: string
          notes?: string | null
          notice_end_date?: string | null
          notice_start_date?: string | null
          notice_type?: string | null
          organization_id: string
          responsible_user_id?: string | null
          signature_envelope_id?: string | null
          status?: string
          termination_cause?: string | null
          termination_date?: string | null
          termination_decision?: string | null
          termination_details_id?: string | null
          termination_reason?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          exam_id?: string | null
          exam_schedule_id?: string | null
          id?: string
          notes?: string | null
          notice_end_date?: string | null
          notice_start_date?: string | null
          notice_type?: string | null
          organization_id?: string
          responsible_user_id?: string | null
          signature_envelope_id?: string | null
          status?: string
          termination_cause?: string | null
          termination_date?: string | null
          termination_decision?: string | null
          termination_details_id?: string | null
          termination_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "termination_processes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_processes_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "medical_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_processes_exam_schedule_id_fkey"
            columns: ["exam_schedule_id"]
            isOneToOne: false
            referencedRelation: "medical_exam_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_processes_signature_envelope_id_fkey"
            columns: ["signature_envelope_id"]
            isOneToOne: false
            referencedRelation: "signature_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_processes_termination_details_id_fkey"
            columns: ["termination_details_id"]
            isOneToOne: false
            referencedRelation: "termination_details"
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
      time_clock_device_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          device_id: string
          expires_at: string | null
          id: string
          organization_id: string
          revoked_at: string | null
          scope: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_id: string
          expires_at?: string | null
          id?: string
          organization_id: string
          revoked_at?: string | null
          scope?: string
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_id?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          revoked_at?: string | null
          scope?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_device_tokens_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "time_clock_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_device_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_device_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_devices: {
        Row: {
          cost_center_id: string | null
          created_at: string
          device_type: Database["public"]["Enums"]["time_clock_device_type"]
          firmware_version: string | null
          id: string
          integration_mode: Database["public"]["Enums"]["time_clock_integration_mode"]
          last_event_at: string | null
          last_sync_at: string | null
          legal_entity_id: string | null
          metadata: Json | null
          model: string | null
          name: string
          organization_id: string
          provider: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["time_clock_device_status"]
          updated_at: string
          work_location_id: string | null
        }
        Insert: {
          cost_center_id?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["time_clock_device_type"]
          firmware_version?: string | null
          id?: string
          integration_mode?: Database["public"]["Enums"]["time_clock_integration_mode"]
          last_event_at?: string | null
          last_sync_at?: string | null
          legal_entity_id?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          organization_id: string
          provider?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["time_clock_device_status"]
          updated_at?: string
          work_location_id?: string | null
        }
        Update: {
          cost_center_id?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["time_clock_device_type"]
          firmware_version?: string | null
          id?: string
          integration_mode?: Database["public"]["Enums"]["time_clock_integration_mode"]
          last_event_at?: string | null
          last_sync_at?: string | null
          legal_entity_id?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          organization_id?: string
          provider?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["time_clock_device_status"]
          updated_at?: string
          work_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_devices_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_devices_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "legal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_devices_work_location_id_fkey"
            columns: ["work_location_id"]
            isOneToOne: false
            referencedRelation: "organization_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_raw_events: {
        Row: {
          accuracy: number | null
          biometric_match_status: string | null
          created_at: string
          derived_ponto_registro_id: string | null
          derived_time_entry_id: string | null
          device_id: string | null
          direction: Database["public"]["Enums"]["time_clock_direction"]
          employee_id: string | null
          event_time: string
          external_employee_code: string | null
          hash: string | null
          id: string
          latitude: number | null
          longitude: number | null
          organization_id: string
          photo_url: string | null
          processed_at: string | null
          processing_status: Database["public"]["Enums"]["time_clock_processing_status"]
          raw_payload: Json
          received_at: string
          source: string
          source_event_id: string | null
          sync_log_id: string | null
        }
        Insert: {
          accuracy?: number | null
          biometric_match_status?: string | null
          created_at?: string
          derived_ponto_registro_id?: string | null
          derived_time_entry_id?: string | null
          device_id?: string | null
          direction?: Database["public"]["Enums"]["time_clock_direction"]
          employee_id?: string | null
          event_time: string
          external_employee_code?: string | null
          hash?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_id: string
          photo_url?: string | null
          processed_at?: string | null
          processing_status?: Database["public"]["Enums"]["time_clock_processing_status"]
          raw_payload?: Json
          received_at?: string
          source: string
          source_event_id?: string | null
          sync_log_id?: string | null
        }
        Update: {
          accuracy?: number | null
          biometric_match_status?: string | null
          created_at?: string
          derived_ponto_registro_id?: string | null
          derived_time_entry_id?: string | null
          device_id?: string | null
          direction?: Database["public"]["Enums"]["time_clock_direction"]
          employee_id?: string | null
          event_time?: string
          external_employee_code?: string | null
          hash?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_id?: string
          photo_url?: string | null
          processed_at?: string | null
          processing_status?: Database["public"]["Enums"]["time_clock_processing_status"]
          raw_payload?: Json
          received_at?: string
          source?: string
          source_event_id?: string | null
          sync_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_raw_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "time_clock_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_raw_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_raw_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_raw_events_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "time_clock_sync_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_sync_logs: {
        Row: {
          created_at: string
          device_id: string | null
          error_details: Json | null
          events_accepted: number
          events_duplicated: number
          events_received: number
          events_rejected: number
          id: string
          metadata: Json | null
          organization_id: string
          source_file: string | null
          sync_status: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          error_details?: Json | null
          events_accepted?: number
          events_duplicated?: number
          events_received?: number
          events_rejected?: number
          id?: string
          metadata?: Json | null
          organization_id: string
          source_file?: string | null
          sync_status: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          error_details?: Json | null
          events_accepted?: number
          events_duplicated?: number
          events_received?: number
          events_rejected?: number
          id?: string
          metadata?: Json | null
          organization_id?: string
          source_file?: string | null
          sync_status?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_sync_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "time_clock_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_sync_logs_organization_id_fkey"
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
          device_id: string | null
          employee_id: string
          id: string
          lunch_out: string | null
          lunch_return: string | null
          notes: string | null
          organization_id: string
          source_raw_event_id: string | null
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
          device_id?: string | null
          employee_id: string
          id?: string
          lunch_out?: string | null
          lunch_return?: string | null
          notes?: string | null
          organization_id: string
          source_raw_event_id?: string | null
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
          device_id?: string | null
          employee_id?: string
          id?: string
          lunch_out?: string | null
          lunch_return?: string | null
          notes?: string | null
          organization_id?: string
          source_raw_event_id?: string | null
          total_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "time_clock_devices"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "time_entries_source_raw_event_id_fkey"
            columns: ["source_raw_event_id"]
            isOneToOne: false
            referencedRelation: "time_clock_raw_events"
            referencedColumns: ["id"]
          },
        ]
      }
      time_inconsistencies: {
        Row: {
          actual_value: Json | null
          created_at: string
          day: string
          description: string | null
          employee_id: string
          expected_value: Json | null
          id: string
          justification_id: string | null
          manager_id: string | null
          organization_id: string
          raw_event_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["inconsistency_severity"]
          status: Database["public"]["Enums"]["inconsistency_status"]
          time_entry_id: string | null
          type: Database["public"]["Enums"]["inconsistency_type"]
          updated_at: string
        }
        Insert: {
          actual_value?: Json | null
          created_at?: string
          day: string
          description?: string | null
          employee_id: string
          expected_value?: Json | null
          id?: string
          justification_id?: string | null
          manager_id?: string | null
          organization_id: string
          raw_event_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["inconsistency_severity"]
          status?: Database["public"]["Enums"]["inconsistency_status"]
          time_entry_id?: string | null
          type: Database["public"]["Enums"]["inconsistency_type"]
          updated_at?: string
        }
        Update: {
          actual_value?: Json | null
          created_at?: string
          day?: string
          description?: string | null
          employee_id?: string
          expected_value?: Json | null
          id?: string
          justification_id?: string | null
          manager_id?: string | null
          organization_id?: string
          raw_event_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["inconsistency_severity"]
          status?: Database["public"]["Enums"]["inconsistency_status"]
          time_entry_id?: string | null
          type?: Database["public"]["Enums"]["inconsistency_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_inconsistencies_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_inconsistencies_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: false
            referencedRelation: "justificativas_ponto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_inconsistencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_inconsistencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_inconsistencies_raw_event_id_fkey"
            columns: ["raw_event_id"]
            isOneToOne: false
            referencedRelation: "time_clock_raw_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_inconsistencies_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
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
          return_confirmed_by: string | null
          return_notes: string | null
          returned_at: string | null
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
          return_confirmed_by?: string | null
          return_notes?: string | null
          returned_at?: string | null
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
          return_confirmed_by?: string | null
          return_notes?: string | null
          returned_at?: string | null
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
          format: string | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          name: string
          organization_id: string
          provider: string | null
          skill_ids: string[] | null
          updated_at: string
          url: string | null
        }
        Insert: {
          career_points?: number | null
          category?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_hours?: number | null
          format?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name: string
          organization_id: string
          provider?: string | null
          skill_ids?: string[] | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          career_points?: number | null
          category?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_hours?: number | null
          format?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name?: string
          organization_id?: string
          provider?: string | null
          skill_ids?: string[] | null
          updated_at?: string
          url?: string | null
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
      work_policies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          in_office_days_per_month: number | null
          in_office_days_per_week: number | null
          name: string
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          in_office_days_per_month?: number | null
          in_office_days_per_week?: number | null
          name: string
          organization_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          in_office_days_per_month?: number | null
          in_office_days_per_week?: number | null
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string
          hour_bank_rules: Json | null
          hours_per_day: number
          hours_per_week: number
          id: string
          late_tolerance_minutes: number
          name: string
          organization_id: string
          overtime_rules: Json | null
          type: string
          updated_at: string
          work_days: Json
        }
        Insert: {
          created_at?: string
          hour_bank_rules?: Json | null
          hours_per_day?: number
          hours_per_week?: number
          id?: string
          late_tolerance_minutes?: number
          name: string
          organization_id: string
          overtime_rules?: Json | null
          type?: string
          updated_at?: string
          work_days?: Json
        }
        Update: {
          created_at?: string
          hour_bank_rules?: Json | null
          hours_per_day?: number
          hours_per_week?: number
          id?: string
          late_tolerance_minutes?: number
          name?: string
          organization_id?: string
          overtime_rules?: Json | null
          type?: string
          updated_at?: string
          work_days?: Json
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_organization_id_fkey"
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
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_same_org: { Args: { _org_id: string }; Returns: boolean }
      log_platform_action: {
        Args: {
          _action: string
          _metadata?: Json
          _target_organization_id?: string
          _target_user_id?: string
        }
        Returns: string
      }
      tcraw_mark_processed: {
        Args: {
          _event_id: string
          _ponto_registro_id?: string
          _status: Database["public"]["Enums"]["time_clock_processing_status"]
          _time_entry_id?: string
        }
        Returns: undefined
      }
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
      admission_checklist_status: "pending" | "done" | "skipped"
      admission_doc_status: "pending" | "submitted" | "approved" | "rejected"
      admission_status:
        | "draft"
        | "invited"
        | "in_progress"
        | "review"
        | "signed"
        | "completed"
        | "cancelled"
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
      calendar_day_type:
        | "feriado_nacional"
        | "feriado_estadual"
        | "feriado_municipal"
        | "ponto_facultativo"
        | "evento_interno"
        | "dia_util_extra"
      calendar_scope:
        | "default"
        | "regional"
        | "unit"
        | "cost_center"
        | "legal_entity"
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
      document_kind:
        | "contrato_admissao"
        | "aditivo"
        | "distrato"
        | "recibo"
        | "ferias"
        | "advertencia"
        | "declaracao"
        | "procuracao"
        | "politica"
        | "outro"
      document_status:
        | "rascunho"
        | "aguardando_assinatura"
        | "assinado"
        | "recusado"
        | "arquivado"
        | "expirado"
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
      export_job_status:
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      export_job_type:
        | "payroll_csv"
        | "payroll_pdf"
        | "time_entries_csv"
        | "absenteeism_csv"
        | "inconsistencies_csv"
        | "employees_csv"
        | "audit_csv"
        | "custom"
      feedback_type: "positive" | "neutral" | "negative"
      gender: "male" | "female" | "non_binary" | "prefer_not_to_say"
      inconsistency_severity: "info" | "warning" | "critical"
      inconsistency_status:
        | "open"
        | "in_review"
        | "resolved"
        | "justified"
        | "ignored"
      inconsistency_type:
        | "falta"
        | "atraso"
        | "saida_antecipada"
        | "marcacao_faltante"
        | "marcacao_excedente"
        | "jornada_nao_cumprida"
        | "fora_da_cerca"
        | "intervalo_insuficiente"
        | "duplicado"
        | "horas_extras_nao_autorizadas"
      job_status: "active" | "closed" | "draft" | "on_hold"
      marital_status:
        | "single"
        | "married"
        | "divorced"
        | "widowed"
        | "domestic_partnership"
        | "prefer_not_to_say"
      payroll_batch_status:
        | "draft"
        | "matching"
        | "ready"
        | "published"
        | "cancelled"
      payroll_competency_status:
        | "aberta"
        | "em_processamento"
        | "fechada"
        | "paga"
        | "cancelada"
      payroll_event_kind: "provento" | "desconto" | "informativo" | "base"
      payroll_match_status: "matched" | "ambiguous" | "unmatched"
      payroll_receipt_type:
        | "holerite"
        | "recibo"
        | "decimo_terceiro"
        | "ferias"
        | "rescisao"
      payslip_ack_status: "pending" | "viewed" | "acknowledged" | "signed"
      payslip_source: "internal_generated" | "batch_upload" | "external"
      pdi_goal_status: "pendente" | "em_andamento" | "concluida"
      pdi_goal_type: "tecnico" | "comportamental" | "lideranca" | "carreira"
      pdi_status:
        | "rascunho"
        | "em_andamento"
        | "entregue"
        | "concluido"
        | "cancelado"
      pending_task_priority: "low" | "medium" | "high" | "urgent"
      pending_task_status: "open" | "in_progress" | "done" | "dismissed"
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
      signature_envelope_status:
        | "draft"
        | "sent"
        | "partially_signed"
        | "signed"
        | "refused"
        | "cancelled"
        | "expired"
      signature_provider:
        | "clicksign"
        | "d4sign"
        | "zapsign"
        | "docusign"
        | "manual"
      signer_status: "pending" | "signed" | "refused" | "expired"
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
      time_clock_device_status:
        | "active"
        | "inactive"
        | "offline"
        | "error"
        | "pending"
      time_clock_device_type:
        | "rep_p"
        | "rep_a"
        | "rep_c"
        | "tablet_kiosk"
        | "mobile_app"
        | "web"
        | "qr_gps"
        | "biometric"
        | "manual_upload"
      time_clock_direction:
        | "in"
        | "out"
        | "break_start"
        | "break_end"
        | "unknown"
      time_clock_integration_mode:
        | "api"
        | "webhook"
        | "afd_file"
        | "csv_file"
        | "manual_upload"
        | "native"
      time_clock_processing_status:
        | "pending"
        | "processed"
        | "conflict"
        | "rejected"
        | "ignored"
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
      admission_checklist_status: ["pending", "done", "skipped"],
      admission_doc_status: ["pending", "submitted", "approved", "rejected"],
      admission_status: [
        "draft",
        "invited",
        "in_progress",
        "review",
        "signed",
        "completed",
        "cancelled",
      ],
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
      calendar_day_type: [
        "feriado_nacional",
        "feriado_estadual",
        "feriado_municipal",
        "ponto_facultativo",
        "evento_interno",
        "dia_util_extra",
      ],
      calendar_scope: [
        "default",
        "regional",
        "unit",
        "cost_center",
        "legal_entity",
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
      document_kind: [
        "contrato_admissao",
        "aditivo",
        "distrato",
        "recibo",
        "ferias",
        "advertencia",
        "declaracao",
        "procuracao",
        "politica",
        "outro",
      ],
      document_status: [
        "rascunho",
        "aguardando_assinatura",
        "assinado",
        "recusado",
        "arquivado",
        "expirado",
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
      export_job_status: [
        "queued",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      export_job_type: [
        "payroll_csv",
        "payroll_pdf",
        "time_entries_csv",
        "absenteeism_csv",
        "inconsistencies_csv",
        "employees_csv",
        "audit_csv",
        "custom",
      ],
      feedback_type: ["positive", "neutral", "negative"],
      gender: ["male", "female", "non_binary", "prefer_not_to_say"],
      inconsistency_severity: ["info", "warning", "critical"],
      inconsistency_status: [
        "open",
        "in_review",
        "resolved",
        "justified",
        "ignored",
      ],
      inconsistency_type: [
        "falta",
        "atraso",
        "saida_antecipada",
        "marcacao_faltante",
        "marcacao_excedente",
        "jornada_nao_cumprida",
        "fora_da_cerca",
        "intervalo_insuficiente",
        "duplicado",
        "horas_extras_nao_autorizadas",
      ],
      job_status: ["active", "closed", "draft", "on_hold"],
      marital_status: [
        "single",
        "married",
        "divorced",
        "widowed",
        "domestic_partnership",
        "prefer_not_to_say",
      ],
      payroll_batch_status: [
        "draft",
        "matching",
        "ready",
        "published",
        "cancelled",
      ],
      payroll_competency_status: [
        "aberta",
        "em_processamento",
        "fechada",
        "paga",
        "cancelada",
      ],
      payroll_event_kind: ["provento", "desconto", "informativo", "base"],
      payroll_match_status: ["matched", "ambiguous", "unmatched"],
      payroll_receipt_type: [
        "holerite",
        "recibo",
        "decimo_terceiro",
        "ferias",
        "rescisao",
      ],
      payslip_ack_status: ["pending", "viewed", "acknowledged", "signed"],
      payslip_source: ["internal_generated", "batch_upload", "external"],
      pdi_goal_status: ["pendente", "em_andamento", "concluida"],
      pdi_goal_type: ["tecnico", "comportamental", "lideranca", "carreira"],
      pdi_status: [
        "rascunho",
        "em_andamento",
        "entregue",
        "concluido",
        "cancelado",
      ],
      pending_task_priority: ["low", "medium", "high", "urgent"],
      pending_task_status: ["open", "in_progress", "done", "dismissed"],
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
      signature_envelope_status: [
        "draft",
        "sent",
        "partially_signed",
        "signed",
        "refused",
        "cancelled",
        "expired",
      ],
      signature_provider: [
        "clicksign",
        "d4sign",
        "zapsign",
        "docusign",
        "manual",
      ],
      signer_status: ["pending", "signed", "refused", "expired"],
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
      time_clock_device_status: [
        "active",
        "inactive",
        "offline",
        "error",
        "pending",
      ],
      time_clock_device_type: [
        "rep_p",
        "rep_a",
        "rep_c",
        "tablet_kiosk",
        "mobile_app",
        "web",
        "qr_gps",
        "biometric",
        "manual_upload",
      ],
      time_clock_direction: [
        "in",
        "out",
        "break_start",
        "break_end",
        "unknown",
      ],
      time_clock_integration_mode: [
        "api",
        "webhook",
        "afd_file",
        "csv_file",
        "manual_upload",
        "native",
      ],
      time_clock_processing_status: [
        "pending",
        "processed",
        "conflict",
        "rejected",
        "ignored",
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
