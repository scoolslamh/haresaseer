export interface Guard {
  id: string;
  region: string;
  governorate: string;
  city: string;
  school_name: string;
  principal_name: string;
  principal_mobile: string;
  guard_name: string;
  civil_id: string;
  gender: string;
  birth_date: string;
  insurance: string;
  start_date: string;
  mobile: string;
  iban: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GuardFormData {
  region: string;
  governorate: string;
  city: string;
  school_name: string;
  principal_name: string;
  principal_mobile: string;
  guard_name: string;
  civil_id: string;
  gender: string;
  birth_date: string;
  insurance: string;
  start_date: string;
  mobile: string;
  iban: string;
  notes: string;
}

export interface ImportGuardData {
  region?: string;
  governorate?: string;
  city?: string;
  school_name: string;
  principal_name?: string;
  principal_mobile?: string;
  guard_name: string;
  civil_id?: string;
  gender?: string;
  birth_date?: string;
  insurance?: string;
  start_date?: string;
  mobile?: string;
  iban?: string;
  notes?: string;
}