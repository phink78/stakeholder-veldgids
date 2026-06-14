export type AvgLabel = 'publiek' | 'intern' | 'vertrouwelijk'
export type OrgType = 'NGO' | 'Overheid' | 'Bedrijf' | 'Media' | 'Academisch' | 'Anders'
export type Strategie = 'Remain on strategy' | 'Last action' | 'Increase action' | 'Start engagement'

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          naam: string
          thema: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          naam: string
          thema: string
        }
        Update: {
          naam?: string
          thema?: string
        }
      }
      organisations: {
        Row: {
          id: string
          project_id: string
          naam: string
          type: OrgType | null
          eigen_agenda: string | null
          positie_x: number
          positie_y: number
          avg_label: AvgLabel
          strategie: Strategie | null
          focus: boolean
          ai_ingevuld: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
          naam: string
          type?: OrgType | null
          eigen_agenda?: string | null
          positie_x?: number
          positie_y?: number
          avg_label?: AvgLabel
          strategie?: Strategie | null
          focus?: boolean
          ai_ingevuld?: boolean
        }
        Update: {
          naam?: string
          type?: OrgType | null
          eigen_agenda?: string | null
          positie_x?: number
          positie_y?: number
          avg_label?: AvgLabel
          strategie?: Strategie | null
          focus?: boolean
          ai_ingevuld?: boolean
        }
      }
      roles: {
        Row: {
          id: string
          organisation_id: string
          titel: string
          beschrijving: string | null
          created_at: string
        }
        Insert: {
          organisation_id: string
          titel: string
          beschrijving?: string | null
        }
        Update: {
          titel?: string
          beschrijving?: string | null
        }
      }
      persons: {
        Row: {
          id: string
          role_id: string
          naam: string
          email: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          role_id: string
          naam: string
          email?: string | null
          expires_at?: string
        }
        Update: {
          naam?: string
          email?: string | null
          expires_at?: string
        }
      }
      signals: {
        Row: {
          id: string
          organisation_id: string
          bron: string
          inhoud: string
          datum: string
          created_at: string
        }
        Insert: {
          organisation_id: string
          bron: string
          inhoud: string
          datum: string
        }
        Update: {
          bron?: string
          inhoud?: string
          datum?: string
        }
      }
    }
  }
}
