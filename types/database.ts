/**
 * Hand-maintained Database typing aligned with supabase/migrations.
 * Replace with `supabase gen types typescript` when convenient.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TimestampFields = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string;
          iso_code: string;
          name: string;
          currency_code: "CAD" | "USD";
          default_locale: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          iso_code: string;
          name: string;
          currency_code: "CAD" | "USD";
          default_locale: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          iso_code?: string;
          name?: string;
          currency_code?: "CAD" | "USD";
          default_locale?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      administrative_regions: {
        Row: {
          id: string;
          country_id: string;
          code: string;
          name: string;
          region_type: "province" | "territory" | "state" | "district";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          country_id: string;
          code: string;
          name: string;
          region_type: "province" | "territory" | "state" | "district";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          country_id?: string;
          code?: string;
          name?: string;
          region_type?: "province" | "territory" | "state" | "district";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          country_id: string;
          administrative_region_id: string;
          name: string;
          display_name: string;
          subdomain: string;
          slug: string;
          community_type:
            | "city"
            | "town"
            | "township"
            | "village"
            | "municipality"
            | "county"
            | "region"
            | "district"
            | "borough"
            | "neighbourhood"
            | "metro"
            | "association";
          timezone: string;
          latitude: number | null;
          longitude: number | null;
          population: number | null;
          market_status:
            | "planned"
            | "preparing"
            | "nominations"
            | "voting"
            | "auditing"
            | "results"
            | "archived"
            | "paused";
          is_public: boolean;
          launched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          country_id: string;
          administrative_region_id: string;
          name: string;
          display_name: string;
          subdomain: string;
          slug: string;
          community_type:
            | "city"
            | "town"
            | "township"
            | "village"
            | "municipality"
            | "county"
            | "region"
            | "district"
            | "borough"
            | "neighbourhood"
            | "metro"
            | "association";
          timezone: string;
          latitude?: number | null;
          longitude?: number | null;
          population?: number | null;
          market_status:
            | "planned"
            | "preparing"
            | "nominations"
            | "voting"
            | "auditing"
            | "results"
            | "archived"
            | "paused";
          is_public?: boolean;
          launched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          country_id?: string;
          administrative_region_id?: string;
          name?: string;
          display_name?: string;
          subdomain?: string;
          slug?: string;
          community_type?:
            | "city"
            | "town"
            | "township"
            | "village"
            | "municipality"
            | "county"
            | "region"
            | "district"
            | "borough"
            | "neighbourhood"
            | "metro"
            | "association";
          timezone?: string;
          latitude?: number | null;
          longitude?: number | null;
          population?: number | null;
          market_status?:
            | "planned"
            | "preparing"
            | "nominations"
            | "voting"
            | "auditing"
            | "results"
            | "archived"
            | "paused";
          is_public?: boolean;
          launched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_aliases: {
        Row: {
          id: string;
          community_id: string;
          alias: string;
          normalized_alias: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          alias: string;
          normalized_alias: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          alias?: string;
          normalized_alias?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          preferred_locale: string;
          preferred_currency: "CAD" | "USD";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string;
          preferred_currency?: "CAD" | "USD";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string;
          preferred_currency?: "CAD" | "USD";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_roles: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_platform_roles: {
        Row: {
          user_id: string;
          platform_role_id: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          user_id: string;
          platform_role_id: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          user_id?: string;
          platform_role_id?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      role_change_audit_log: {
        Row: {
          id: string;
          actor_user_id: string | null;
          target_user_id: string;
          platform_role_key: string;
          action: "granted" | "revoked";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          target_user_id: string;
          platform_role_key: string;
          action: "granted" | "revoked";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          target_user_id?: string;
          platform_role_key?: string;
          action?: "granted" | "revoked";
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      auth_rate_limit_attempts: {
        Row: {
          id: string;
          action: string;
          identifier: string;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          identifier: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          identifier?: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          default_nomination_days: number;
          default_review_days: number;
          default_voting_days: number;
          default_audit_days: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          default_nomination_days: number;
          default_review_days: number;
          default_voting_days: number;
          default_audit_days: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          default_nomination_days?: number;
          default_review_days?: number;
          default_voting_days?: number;
          default_audit_days?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          community_id: string;
          campaign_template_id: string | null;
          year: number;
          name: string;
          status:
            | "draft"
            | "scheduled"
            | "nominations_open"
            | "nominations_closed"
            | "finalist_review"
            | "voting_open"
            | "voting_closed"
            | "auditing"
            | "results_scheduled"
            | "results_published"
            | "archived"
            | "cancelled";
          nomination_opens_at: string;
          nomination_closes_at: string;
          finalist_review_closes_at: string;
          voting_opens_at: string;
          voting_closes_at: string;
          results_publish_at: string;
          timezone: string;
          exact_vote_totals_public: boolean;
          voting_locked_at: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          community_id: string;
          campaign_template_id?: string | null;
          year: number;
          name: string;
          status:
            | "draft"
            | "scheduled"
            | "nominations_open"
            | "nominations_closed"
            | "finalist_review"
            | "voting_open"
            | "voting_closed"
            | "auditing"
            | "results_scheduled"
            | "results_published"
            | "archived"
            | "cancelled";
          nomination_opens_at: string;
          nomination_closes_at: string;
          finalist_review_closes_at: string;
          voting_opens_at: string;
          voting_closes_at: string;
          results_publish_at: string;
          timezone: string;
          exact_vote_totals_public?: boolean;
          voting_locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          community_id?: string;
          campaign_template_id?: string | null;
          year?: number;
          name?: string;
          status?:
            | "draft"
            | "scheduled"
            | "nominations_open"
            | "nominations_closed"
            | "finalist_review"
            | "voting_open"
            | "voting_closed"
            | "auditing"
            | "results_scheduled"
            | "results_published"
            | "archived"
            | "cancelled";
          nomination_opens_at?: string;
          nomination_closes_at?: string;
          finalist_review_closes_at?: string;
          voting_opens_at?: string;
          voting_closes_at?: string;
          results_publish_at?: string;
          timezone?: string;
          exact_vote_totals_public?: boolean;
          voting_locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      campaign_phases: {
        Row: {
          id: string;
          campaign_id: string;
          phase: "nomination" | "finalist_review" | "voting" | "audit" | "results";
          starts_at: string;
          ends_at: string;
          status: "scheduled" | "active" | "completed" | "skipped" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          phase: "nomination" | "finalist_review" | "voting" | "audit" | "results";
          starts_at: string;
          ends_at: string;
          status: "scheduled" | "active" | "completed" | "skipped" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          phase?: "nomination" | "finalist_review" | "voting" | "audit" | "results";
          starts_at?: string;
          ends_at?: string;
          status?: "scheduled" | "active" | "completed" | "skipped" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      category_groups: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          display_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          display_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          display_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      master_categories: {
        Row: {
          id: string;
          category_group_id: string;
          name: string;
          slug: string;
          description: string;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_group_id: string;
          name: string;
          slug: string;
          description?: string;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_group_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_categories: {
        Row: {
          id: string;
          campaign_id: string;
          master_category_id: string;
          local_name: string | null;
          local_slug: string | null;
          local_description: string | null;
          finalist_limit: number;
          minimum_nomination_count: number;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          master_category_id: string;
          local_name?: string | null;
          local_slug?: string | null;
          local_description?: string | null;
          finalist_limit?: number;
          minimum_nomination_count?: number;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          master_category_id?: string;
          local_name?: string | null;
          local_slug?: string | null;
          local_description?: string | null;
          finalist_limit?: number;
          minimum_nomination_count?: number;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_change_audit_log: {
        Row: {
          id: string;
          actor_user_id: string | null;
          community_id: string | null;
          campaign_id: string | null;
          entity_type:
            | "campaign_template"
            | "campaign"
            | "campaign_phase"
            | "category_group"
            | "master_category"
            | "campaign_category";
          entity_id: string | null;
          action:
            | "created"
            | "updated"
            | "deleted"
            | "published"
            | "archived"
            | "status_changed";
          summary: string;
          before_data: Json;
          after_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          community_id?: string | null;
          campaign_id?: string | null;
          entity_type:
            | "campaign_template"
            | "campaign"
            | "campaign_phase"
            | "category_group"
            | "master_category"
            | "campaign_category";
          entity_id?: string | null;
          action:
            | "created"
            | "updated"
            | "deleted"
            | "published"
            | "archived"
            | "status_changed";
          summary?: string;
          before_data?: Json;
          after_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          community_id?: string | null;
          campaign_id?: string | null;
          entity_type?:
            | "campaign_template"
            | "campaign"
            | "campaign_phase"
            | "category_group"
            | "master_category"
            | "campaign_category";
          entity_id?: string | null;
          action?:
            | "created"
            | "updated"
            | "deleted"
            | "published"
            | "archived"
            | "status_changed";
          summary?: string;
          before_data?: Json;
          after_data?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      community_launch_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          community_name: string;
          region: string;
          country_code: "CA" | "US";
          notes: string | null;
          status: "new" | "reviewing" | "accepted" | "declined" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          community_name: string;
          region: string;
          country_code: "CA" | "US";
          notes?: string | null;
          status?: "new" | "reviewing" | "accepted" | "declined" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          community_name?: string;
          region?: string;
          country_code?: "CA" | "US";
          notes?: string | null;
          status?: "new" | "reviewing" | "accepted" | "declined" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          source_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          source_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          message?: string;
          source_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      community_launch_list: {
        Row: {
          id: string;
          community_id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          legal_name: string;
          public_name: string;
          slug: string;
          description: string;
          website_url: string | null;
          primary_phone: string | null;
          primary_email: string | null;
          logo_url: string | null;
          status: "draft" | "pending_review" | "approved" | "rejected" | "suspended";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          legal_name: string;
          public_name: string;
          slug: string;
          description?: string;
          website_url?: string | null;
          primary_phone?: string | null;
          primary_email?: string | null;
          logo_url?: string | null;
          status?: "draft" | "pending_review" | "approved" | "rejected" | "suspended";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          legal_name?: string;
          public_name?: string;
          slug?: string;
          description?: string;
          website_url?: string | null;
          primary_phone?: string | null;
          primary_email?: string | null;
          logo_url?: string | null;
          status?: "draft" | "pending_review" | "approved" | "rejected" | "suspended";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      business_locations: {
        Row: {
          id: string;
          business_id: string;
          community_id: string;
          location_name: string;
          slug: string;
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          administrative_region_code: string | null;
          country_code: "CA" | "US" | null;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          website_url: string | null;
          service_area_business: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          community_id: string;
          location_name: string;
          slug: string;
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          administrative_region_code?: string | null;
          country_code?: "CA" | "US" | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          website_url?: string | null;
          service_area_business?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          community_id?: string;
          location_name?: string;
          slug?: string;
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          administrative_region_code?: string | null;
          country_code?: "CA" | "US" | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          website_url?: string | null;
          service_area_business?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      business_hours: {
        Row: {
          id: string;
          business_location_id: string;
          day_of_week: number;
          opens_at: string | null;
          closes_at: string | null;
          closed: boolean;
          appointment_only: boolean;
        };
        Insert: {
          id?: string;
          business_location_id: string;
          day_of_week: number;
          opens_at?: string | null;
          closes_at?: string | null;
          closed?: boolean;
          appointment_only?: boolean;
        };
        Update: {
          id?: string;
          business_location_id?: string;
          day_of_week?: number;
          opens_at?: string | null;
          closes_at?: string | null;
          closed?: boolean;
          appointment_only?: boolean;
        };
        Relationships: [];
      };
      business_social_links: {
        Row: {
          id: string;
          business_id: string;
          platform: "facebook" | "instagram" | "x" | "tiktok" | "youtube" | "linkedin" | "other";
          url: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          platform: "facebook" | "instagram" | "x" | "tiktok" | "youtube" | "linkedin" | "other";
          url: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          platform?: "facebook" | "instagram" | "x" | "tiktok" | "youtube" | "linkedin" | "other";
          url?: string;
        };
        Relationships: [];
      };
      business_media: {
        Row: {
          id: string;
          business_id: string;
          business_location_id: string | null;
          media_type: "logo" | "photo" | "cover";
          storage_path: string;
          alt_text: string;
          display_order: number;
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          business_location_id?: string | null;
          media_type: "logo" | "photo" | "cover";
          storage_path: string;
          alt_text?: string;
          display_order?: number;
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          business_location_id?: string | null;
          media_type?: "logo" | "photo" | "cover";
          storage_path?: string;
          alt_text?: string;
          display_order?: number;
          approved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      business_category_assignments: {
        Row: {
          id: string;
          business_location_id: string;
          campaign_category_id: string;
          status: "pending" | "approved" | "rejected" | "withdrawn";
          assigned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_location_id: string;
          campaign_category_id: string;
          status?: "pending" | "approved" | "rejected" | "withdrawn";
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_location_id?: string;
          campaign_category_id?: string;
          status?: "pending" | "approved" | "rejected" | "withdrawn";
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_submission_requests: {
        Row: {
          id: string;
          campaign_id: string;
          submitted_by_user_id: string | null;
          business_name: string;
          category_id: string | null;
          address: string | null;
          website_url: string | null;
          phone: string | null;
          submitter_email: string;
          status: "pending" | "approved" | "rejected" | "needs_info";
          reviewer_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          submitted_by_user_id?: string | null;
          business_name: string;
          category_id?: string | null;
          address?: string | null;
          website_url?: string | null;
          phone?: string | null;
          submitter_email: string;
          status?: "pending" | "approved" | "rejected" | "needs_info";
          reviewer_notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          submitted_by_user_id?: string | null;
          business_name?: string;
          category_id?: string | null;
          address?: string | null;
          website_url?: string | null;
          phone?: string | null;
          submitter_email?: string;
          status?: "pending" | "approved" | "rejected" | "needs_info";
          reviewer_notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      business_import_batches: {
        Row: {
          id: string;
          community_id: string;
          campaign_id: string | null;
          imported_by: string | null;
          filename: string;
          status: "preview" | "completed" | "cancelled" | "failed";
          row_count: number;
          imported_count: number;
          skipped_count: number;
          duplicate_count: number;
          notes: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          community_id: string;
          campaign_id?: string | null;
          imported_by?: string | null;
          filename: string;
          status?: "preview" | "completed" | "cancelled" | "failed";
          row_count?: number;
          imported_count?: number;
          skipped_count?: number;
          duplicate_count?: number;
          notes?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          community_id?: string;
          campaign_id?: string | null;
          imported_by?: string | null;
          filename?: string;
          status?: "preview" | "completed" | "cancelled" | "failed";
          row_count?: number;
          imported_count?: number;
          skipped_count?: number;
          duplicate_count?: number;
          notes?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      business_import_rows: {
        Row: {
          id: string;
          batch_id: string;
          row_number: number;
          payload: Json;
          validation_errors: string[];
          duplicate_candidates: Json;
          resolution: "pending" | "import" | "skip" | "merge_manual";
          resulting_business_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          row_number: number;
          payload?: Json;
          validation_errors?: string[];
          duplicate_candidates?: Json;
          resolution?: "pending" | "import" | "skip" | "merge_manual";
          resulting_business_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          row_number?: number;
          payload?: Json;
          validation_errors?: string[];
          duplicate_candidates?: Json;
          resolution?: "pending" | "import" | "skip" | "merge_manual";
          resulting_business_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      business_claims: {
        Row: {
          id: string;
          business_id: string;
          business_location_id: string | null;
          requested_by_user_id: string;
          verification_method: "domain_email" | "manual_evidence" | "admin_assisted";
          submitted_email: string;
          evidence_storage_path: string | null;
          status:
            | "pending"
            | "email_verification"
            | "evidence_required"
            | "under_review"
            | "approved"
            | "rejected"
            | "cancelled"
            | "expired";
          reviewer_id: string | null;
          reviewer_notes: string | null;
          requested_at: string;
          reviewed_at: string | null;
          expires_at: string;
          domain_email_matched: boolean;
        };
        Insert: {
          id?: string;
          business_id: string;
          business_location_id?: string | null;
          requested_by_user_id: string;
          verification_method: "domain_email" | "manual_evidence" | "admin_assisted";
          submitted_email: string;
          evidence_storage_path?: string | null;
          status?:
            | "pending"
            | "email_verification"
            | "evidence_required"
            | "under_review"
            | "approved"
            | "rejected"
            | "cancelled"
            | "expired";
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          requested_at?: string;
          reviewed_at?: string | null;
          expires_at?: string;
          domain_email_matched?: boolean;
        };
        Update: {
          id?: string;
          business_id?: string;
          business_location_id?: string | null;
          requested_by_user_id?: string;
          verification_method?: "domain_email" | "manual_evidence" | "admin_assisted";
          submitted_email?: string;
          evidence_storage_path?: string | null;
          status?:
            | "pending"
            | "email_verification"
            | "evidence_required"
            | "under_review"
            | "approved"
            | "rejected"
            | "cancelled"
            | "expired";
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          requested_at?: string;
          reviewed_at?: string | null;
          expires_at?: string;
          domain_email_matched?: boolean;
        };
        Relationships: [];
      };
      business_claim_status_events: {
        Row: {
          id: string;
          claim_id: string;
          from_status: string | null;
          to_status: string;
          actor_user_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          from_status?: string | null;
          to_status: string;
          actor_user_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          claim_id?: string;
          from_status?: string | null;
          to_status?: string;
          actor_user_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      business_memberships: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: "owner" | "administrator" | "manager" | "marketing" | "viewer";
          status: "active" | "invited" | "suspended" | "revoked";
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role: "owner" | "administrator" | "manager" | "marketing" | "viewer";
          status?: "active" | "invited" | "suspended" | "revoked";
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: "owner" | "administrator" | "manager" | "marketing" | "viewer";
          status?: "active" | "invited" | "suspended" | "revoked";
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_invitations: {
        Row: {
          id: string;
          business_id: string;
          email: string;
          role: "owner" | "administrator" | "manager" | "marketing" | "viewer";
          token_hash: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          email: string;
          role: "owner" | "administrator" | "manager" | "marketing" | "viewer";
          token_hash: string;
          invited_by: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          email?: string;
          role?: "owner" | "administrator" | "manager" | "marketing" | "viewer";
          token_hash?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      nominations: {
        Row: {
          id: string;
          campaign_id: string;
          campaign_category_id: string;
          business_location_id: string | null;
          business_submission_request_id: string | null;
          user_id: string;
          verified_email_hash: string;
          status: "valid" | "pending_business_moderation" | "invalidated";
          source: "web" | "admin" | "import";
          created_at: string;
          invalidated_at: string | null;
          invalidated_by: string | null;
          invalidation_reason: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          campaign_category_id: string;
          business_location_id?: string | null;
          business_submission_request_id?: string | null;
          user_id: string;
          verified_email_hash: string;
          status?: "valid" | "pending_business_moderation" | "invalidated";
          source?: "web" | "admin" | "import";
          created_at?: string;
          invalidated_at?: string | null;
          invalidated_by?: string | null;
          invalidation_reason?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          campaign_category_id?: string;
          business_location_id?: string | null;
          business_submission_request_id?: string | null;
          user_id?: string;
          verified_email_hash?: string;
          status?: "valid" | "pending_business_moderation" | "invalidated";
          source?: "web" | "admin" | "import";
          created_at?: string;
          invalidated_at?: string | null;
          invalidated_by?: string | null;
          invalidation_reason?: string | null;
        };
        Relationships: [];
      };
      nomination_events: {
        Row: {
          id: string;
          nomination_id: string;
          event_type:
            | "created"
            | "invalidated"
            | "restored"
            | "business_moderated"
            | "fraud_flagged"
            | "exported";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          nomination_id: string;
          event_type:
            | "created"
            | "invalidated"
            | "restored"
            | "business_moderated"
            | "fraud_flagged"
            | "exported";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          nomination_id?: string;
          event_type?:
            | "created"
            | "invalidated"
            | "restored"
            | "business_moderated"
            | "fraud_flagged"
            | "exported";
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      fraud_signals: {
        Row: {
          id: string;
          campaign_id: string;
          entity_type: "nomination" | "user" | "business_location" | "submission" | "vote" | "finalist";
          entity_id: string;
          signal_type:
            | "rapid_fire"
            | "duplicate_attempt"
            | "turnstile_failure"
            | "closed_phase_attempt"
            | "cross_community_attempt"
            | "unverified_user"
            | "manual_review";
          risk_score: number;
          metadata: Json;
          status: "open" | "reviewed" | "dismissed" | "confirmed";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          entity_type: "nomination" | "user" | "business_location" | "submission" | "vote" | "finalist";
          entity_id: string;
          signal_type:
            | "rapid_fire"
            | "duplicate_attempt"
            | "turnstile_failure"
            | "closed_phase_attempt"
            | "cross_community_attempt"
            | "unverified_user"
            | "manual_review";
          risk_score?: number;
          metadata?: Json;
          status?: "open" | "reviewed" | "dismissed" | "confirmed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          entity_type?: "nomination" | "user" | "business_location" | "submission" | "vote" | "finalist";
          entity_id?: string;
          signal_type?:
            | "rapid_fire"
            | "duplicate_attempt"
            | "turnstile_failure"
            | "closed_phase_attempt"
            | "cross_community_attempt"
            | "unverified_user"
            | "manual_review";
          risk_score?: number;
          metadata?: Json;
          status?: "open" | "reviewed" | "dismissed" | "confirmed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      finalists: {
        Row: {
          id: string;
          campaign_id: string;
          campaign_category_id: string;
          business_location_id: string;
          nomination_count_snapshot: number | null;
          selection_method: "automatic" | "manual";
          status: "proposed" | "approved" | "published" | "removed";
          selected_at: string | null;
          selected_by: string | null;
          admin_notes: string | null;
          removal_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          campaign_category_id: string;
          business_location_id: string;
          nomination_count_snapshot?: number | null;
          selection_method: "automatic" | "manual";
          status?: "proposed" | "approved" | "published" | "removed";
          selected_at?: string | null;
          selected_by?: string | null;
          admin_notes?: string | null;
          removal_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          campaign_category_id?: string;
          business_location_id?: string;
          nomination_count_snapshot?: number | null;
          selection_method?: "automatic" | "manual";
          status?: "proposed" | "approved" | "published" | "removed";
          selected_at?: string | null;
          selected_by?: string | null;
          admin_notes?: string | null;
          removal_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          campaign_id: string;
          campaign_category_id: string;
          finalist_id: string;
          user_id: string;
          verified_email_hash: string;
          status: "active" | "invalidated";
          created_at: string;
          updated_at: string;
          invalidated_at: string | null;
          invalidated_by: string | null;
          invalidation_reason: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          campaign_category_id: string;
          finalist_id: string;
          user_id: string;
          verified_email_hash: string;
          status?: "active" | "invalidated";
          created_at?: string;
          updated_at?: string;
          invalidated_at?: string | null;
          invalidated_by?: string | null;
          invalidation_reason?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          campaign_category_id?: string;
          finalist_id?: string;
          user_id?: string;
          verified_email_hash?: string;
          status?: "active" | "invalidated";
          created_at?: string;
          updated_at?: string;
          invalidated_at?: string | null;
          invalidated_by?: string | null;
          invalidation_reason?: string | null;
        };
        Relationships: [];
      };
      vote_events: {
        Row: {
          id: string;
          vote_id: string;
          event_type:
            | "created"
            | "changed"
            | "invalidated"
            | "restored"
            | "fraud_flagged"
            | "exported";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          vote_id: string;
          event_type:
            | "created"
            | "changed"
            | "invalidated"
            | "restored"
            | "fraud_flagged"
            | "exported";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          vote_id?: string;
          event_type?:
            | "created"
            | "changed"
            | "invalidated"
            | "restored"
            | "fraud_flagged"
            | "exported";
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      result_runs: {
        Row: {
          id: string;
          campaign_id: string;
          status:
            | "draft"
            | "computing"
            | "pending_approval"
            | "approved"
            | "published"
            | "superseded"
            | "cancelled";
          rules_snapshot: Json;
          started_by: string | null;
          started_at: string;
          completed_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          status?:
            | "draft"
            | "computing"
            | "pending_approval"
            | "approved"
            | "published"
            | "superseded"
            | "cancelled";
          rules_snapshot?: Json;
          started_by?: string | null;
          started_at?: string;
          completed_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          status?:
            | "draft"
            | "computing"
            | "pending_approval"
            | "approved"
            | "published"
            | "superseded"
            | "cancelled";
          rules_snapshot?: Json;
          started_by?: string | null;
          started_at?: string;
          completed_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          result_run_id: string;
          campaign_id: string;
          campaign_category_id: string;
          finalist_id: string;
          business_location_id: string;
          valid_vote_count: number;
          placement: "platinum" | "gold" | "silver" | "bronze";
          tied: boolean;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          result_run_id: string;
          campaign_id: string;
          campaign_category_id: string;
          finalist_id: string;
          business_location_id: string;
          valid_vote_count: number;
          placement: "platinum" | "gold" | "silver" | "bronze";
          tied?: boolean;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          result_run_id?: string;
          campaign_id?: string;
          campaign_category_id?: string;
          finalist_id?: string;
          business_location_id?: string;
          valid_vote_count?: number;
          placement?: "platinum" | "gold" | "silver" | "bronze";
          tied?: boolean;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      award_eligibilities: {
        Row: {
          id: string;
          result_id: string;
          business_id: string;
          business_location_id: string;
          campaign_id: string;
          campaign_category_id: string;
          placement: "platinum" | "gold" | "silver" | "bronze";
          eligibility_status: "active" | "revoked";
          personalized_business_name: string;
          personalized_community_name: string;
          personalized_category_name: string;
          personalized_campaign_year: number;
          created_at: string;
          revoked_at: string | null;
          revocation_reason: string | null;
        };
        Insert: {
          id?: string;
          result_id: string;
          business_id: string;
          business_location_id: string;
          campaign_id: string;
          campaign_category_id: string;
          placement: "platinum" | "gold" | "silver" | "bronze";
          eligibility_status?: "active" | "revoked";
          personalized_business_name: string;
          personalized_community_name: string;
          personalized_category_name: string;
          personalized_campaign_year: number;
          created_at?: string;
          revoked_at?: string | null;
          revocation_reason?: string | null;
        };
        Update: {
          id?: string;
          result_id?: string;
          business_id?: string;
          business_location_id?: string;
          campaign_id?: string;
          campaign_category_id?: string;
          placement?: "platinum" | "gold" | "silver" | "bronze";
          eligibility_status?: "active" | "revoked";
          personalized_business_name?: string;
          personalized_community_name?: string;
          personalized_category_name?: string;
          personalized_campaign_year?: number;
          created_at?: string;
          revoked_at?: string | null;
          revocation_reason?: string | null;
        };
        Relationships: [];
      };
      result_run_events: {
        Row: {
          id: string;
          result_run_id: string;
          event_type:
            | "started"
            | "computed"
            | "approved"
            | "published"
            | "superseded"
            | "cancelled"
            | "eligibility_created"
            | "eligibility_revoked"
            | "assets_generated";
          actor_user_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          result_run_id: string;
          event_type:
            | "started"
            | "computed"
            | "approved"
            | "published"
            | "superseded"
            | "cancelled"
            | "eligibility_created"
            | "eligibility_revoked"
            | "assets_generated";
          actor_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          result_run_id?: string;
          event_type?:
            | "started"
            | "computed"
            | "approved"
            | "published"
            | "superseded"
            | "cancelled"
            | "eligibility_created"
            | "eligibility_revoked"
            | "assets_generated";
          actor_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      award_assets: {
        Row: {
          id: string;
          award_eligibility_id: string;
          asset_type:
            | "badge_png"
            | "square_svg"
            | "story_svg"
            | "certificate_pdf"
            | "qr_png";
          storage_path: string;
          content_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          award_eligibility_id: string;
          asset_type:
            | "badge_png"
            | "square_svg"
            | "story_svg"
            | "certificate_pdf"
            | "qr_png";
          storage_path: string;
          content_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          award_eligibility_id?: string;
          asset_type?:
            | "badge_png"
            | "square_svg"
            | "story_svg"
            | "certificate_pdf"
            | "qr_png";
          storage_path?: string;
          content_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          product_type: "physical" | "digital" | "bundle";
          active: boolean;
          requires_award_eligibility: boolean;
          requires_shipping: boolean;
          featured: boolean;
          max_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          product_type: "physical" | "digital" | "bundle";
          active?: boolean;
          requires_award_eligibility?: boolean;
          requires_shipping?: boolean;
          featured?: boolean;
          max_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          product_type?: "physical" | "digital" | "bundle";
          active?: boolean;
          requires_award_eligibility?: boolean;
          requires_shipping?: boolean;
          featured?: boolean;
          max_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string;
          currency_code: "CAD" | "USD";
          price_cents: number;
          weight_grams: number;
          length_mm: number;
          width_mm: number;
          height_mm: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku: string;
          currency_code: "CAD" | "USD";
          price_cents: number;
          weight_grams?: number;
          length_mm?: number;
          width_mm?: number;
          height_mm?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          sku?: string;
          currency_code?: "CAD" | "USD";
          price_cents?: number;
          weight_grams?: number;
          length_mm?: number;
          width_mm?: number;
          height_mm?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey",
            columns: ["product_id"],
            isOneToOne: false,
            referencedRelation: "products",
            referencedColumns: ["id"],
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          product_variant_id: string | null;
          storage_path: string;
          alt_text: string;
          display_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          product_variant_id?: string | null;
          storage_path: string;
          alt_text?: string;
          display_order?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          product_variant_id?: string | null;
          storage_path?: string;
          alt_text?: string;
          display_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey",
            columns: ["product_id"],
            isOneToOne: false,
            referencedRelation: "products",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "product_images_product_variant_id_fkey",
            columns: ["product_variant_id"],
            isOneToOne: false,
            referencedRelation: "product_variants",
            referencedColumns: ["id"],
          },
        ];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_token_hash: string | null;
          currency_code: "CAD" | "USD" | null;
          status: "open" | "converted" | "abandoned" | "merged";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_token_hash?: string | null;
          currency_code?: "CAD" | "USD" | null;
          status?: "open" | "converted" | "abandoned" | "merged";
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_token_hash?: string | null;
          currency_code?: "CAD" | "USD" | null;
          status?: "open" | "converted" | "abandoned" | "merged";
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_variant_id: string;
          award_eligibility_id: string | null;
          quantity: number;
          unit_price_cents: number;
          personalization_snapshot: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_variant_id: string;
          award_eligibility_id?: string | null;
          quantity: number;
          unit_price_cents: number;
          personalization_snapshot?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_variant_id?: string;
          award_eligibility_id?: string | null;
          quantity?: number;
          unit_price_cents?: number;
          personalization_snapshot?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey",
            columns: ["cart_id"],
            isOneToOne: false,
            referencedRelation: "carts",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "cart_items_product_variant_id_fkey",
            columns: ["product_variant_id"],
            isOneToOne: false,
            referencedRelation: "product_variants",
            referencedColumns: ["id"],
          },
        ];
      };
      shipping_zones: {
        Row: {
          id: string;
          name: string;
          country_code: "CA" | "US";
          administrative_region_codes: string[];
          postal_code_patterns: string[];
          active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          country_code: "CA" | "US";
          administrative_region_codes?: string[];
          postal_code_patterns?: string[];
          active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          country_code?: "CA" | "US";
          administrative_region_codes?: string[];
          postal_code_patterns?: string[];
          active?: boolean;
        };
        Relationships: [];
      };
      shipping_methods: {
        Row: {
          id: string;
          shipping_zone_id: string;
          name: string;
          description: string;
          pricing_method: "flat" | "per_item" | "flat_plus_per_item";
          base_price_cents: number;
          price_per_item_cents: number;
          handling_fee_cents: number;
          estimated_min_days: number;
          estimated_max_days: number;
          currency_code: "CAD" | "USD";
          active: boolean;
        };
        Insert: {
          id?: string;
          shipping_zone_id: string;
          name: string;
          description?: string;
          pricing_method: "flat" | "per_item" | "flat_plus_per_item";
          base_price_cents?: number;
          price_per_item_cents?: number;
          handling_fee_cents?: number;
          estimated_min_days?: number;
          estimated_max_days?: number;
          currency_code: "CAD" | "USD";
          active?: boolean;
        };
        Update: {
          id?: string;
          shipping_zone_id?: string;
          name?: string;
          description?: string;
          pricing_method?: "flat" | "per_item" | "flat_plus_per_item";
          base_price_cents?: number;
          price_per_item_cents?: number;
          handling_fee_cents?: number;
          estimated_min_days?: number;
          estimated_max_days?: number;
          currency_code?: "CAD" | "USD";
          active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_methods_shipping_zone_id_fkey",
            columns: ["shipping_zone_id"],
            isOneToOne: false,
            referencedRelation: "shipping_zones",
            referencedColumns: ["id"],
          },
        ];
      };
      shipping_quotes: {
        Row: {
          id: string;
          cart_id: string;
          shipping_method_id: string;
          destination_snapshot: Json;
          subtotal_cents: number;
          shipping_cents: number;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          shipping_method_id: string;
          destination_snapshot?: Json;
          subtotal_cents: number;
          shipping_cents: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          shipping_method_id?: string;
          destination_snapshot?: Json;
          subtotal_cents?: number;
          shipping_cents?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_quotes_cart_id_fkey",
            columns: ["cart_id"],
            isOneToOne: false,
            referencedRelation: "carts",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "shipping_quotes_shipping_method_id_fkey",
            columns: ["shipping_method_id"],
            isOneToOne: false,
            referencedRelation: "shipping_methods",
            referencedColumns: ["id"],
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          business_id: string | null;
          cart_id: string | null;
          currency_code: "CAD" | "USD";
          status:
            | "pending"
            | "awaiting_payment"
            | "paid"
            | "fulfilled"
            | "cancelled"
            | "refunded"
            | "partially_refunded";
          payment_status:
            | "unpaid"
            | "pending"
            | "paid"
            | "failed"
            | "refunded"
            | "partially_refunded";
          fulfillment_status:
            | "not_started"
            | "queued"
            | "in_progress"
            | "shipped"
            | "cancelled";
          subtotal_cents: number;
          shipping_cents: number;
          tax_cents: number;
          discount_cents: number;
          total_cents: number;
          shipping_method_snapshot: Json;
          shipping_address_snapshot: Json;
          billing_address_snapshot: Json;
          customer_email: string;
          stripe_customer_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          fraud_flags: string[];
          fraud_notes: string;
          placed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id: string;
          business_id?: string | null;
          cart_id?: string | null;
          currency_code: "CAD" | "USD";
          status?:
            | "pending"
            | "awaiting_payment"
            | "paid"
            | "fulfilled"
            | "cancelled"
            | "refunded"
            | "partially_refunded";
          payment_status?:
            | "unpaid"
            | "pending"
            | "paid"
            | "failed"
            | "refunded"
            | "partially_refunded";
          fulfillment_status?:
            | "not_started"
            | "queued"
            | "in_progress"
            | "shipped"
            | "cancelled";
          subtotal_cents: number;
          shipping_cents?: number;
          tax_cents?: number;
          discount_cents?: number;
          total_cents: number;
          shipping_method_snapshot?: Json;
          shipping_address_snapshot?: Json;
          billing_address_snapshot?: Json;
          customer_email: string;
          stripe_customer_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          fraud_flags?: string[];
          fraud_notes?: string;
          placed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string;
          business_id?: string | null;
          cart_id?: string | null;
          currency_code?: "CAD" | "USD";
          status?:
            | "pending"
            | "awaiting_payment"
            | "paid"
            | "fulfilled"
            | "cancelled"
            | "refunded"
            | "partially_refunded";
          payment_status?:
            | "unpaid"
            | "pending"
            | "paid"
            | "failed"
            | "refunded"
            | "partially_refunded";
          fulfillment_status?:
            | "not_started"
            | "queued"
            | "in_progress"
            | "shipped"
            | "cancelled";
          subtotal_cents?: number;
          shipping_cents?: number;
          tax_cents?: number;
          discount_cents?: number;
          total_cents?: number;
          shipping_method_snapshot?: Json;
          shipping_address_snapshot?: Json;
          billing_address_snapshot?: Json;
          customer_email?: string;
          stripe_customer_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          fraud_flags?: string[];
          fraud_notes?: string;
          placed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_variant_id: string;
          award_eligibility_id: string | null;
          product_name_snapshot: string;
          variant_name_snapshot: string;
          sku_snapshot: string;
          quantity: number;
          unit_price_cents: number;
          personalization_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_variant_id: string;
          award_eligibility_id?: string | null;
          product_name_snapshot: string;
          variant_name_snapshot: string;
          sku_snapshot: string;
          quantity: number;
          unit_price_cents: number;
          personalization_snapshot?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_variant_id?: string;
          award_eligibility_id?: string | null;
          product_name_snapshot?: string;
          variant_name_snapshot?: string;
          sku_snapshot?: string;
          quantity?: number;
          unit_price_cents?: number;
          personalization_snapshot?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: "stripe";
          provider_payment_id: string;
          amount_cents: number;
          currency_code: "CAD" | "USD";
          status:
            | "pending"
            | "succeeded"
            | "failed"
            | "canceled"
            | "refunded"
            | "partially_refunded";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider?: "stripe";
          provider_payment_id: string;
          amount_cents: number;
          currency_code: "CAD" | "USD";
          status:
            | "pending"
            | "succeeded"
            | "failed"
            | "canceled"
            | "refunded"
            | "partially_refunded";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: "stripe";
          provider_payment_id?: string;
          amount_cents?: number;
          currency_code?: "CAD" | "USD";
          status?:
            | "pending"
            | "succeeded"
            | "failed"
            | "canceled"
            | "refunded"
            | "partially_refunded";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      refunds: {
        Row: {
          id: string;
          order_id: string;
          payment_id: string;
          provider_refund_id: string | null;
          amount_cents: number;
          reason: string;
          status: "pending" | "succeeded" | "failed" | "canceled";
          requested_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_id: string;
          provider_refund_id?: string | null;
          amount_cents: number;
          reason?: string;
          status?: "pending" | "succeeded" | "failed" | "canceled";
          requested_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          payment_id?: string;
          provider_refund_id?: string | null;
          amount_cents?: number;
          reason?: string;
          status?: "pending" | "succeeded" | "failed" | "canceled";
          requested_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refunds_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: "stripe";
          provider_event_id: string;
          event_type: string;
          payload_hash: string;
          processing_status: "received" | "processing" | "processed" | "ignored" | "failed";
          attempts: number;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          provider?: "stripe";
          provider_event_id: string;
          event_type: string;
          payload_hash: string;
          processing_status?: "received" | "processing" | "processed" | "ignored" | "failed";
          attempts?: number;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          provider?: "stripe";
          provider_event_id?: string;
          event_type?: string;
          payload_hash?: string;
          processing_status?: "received" | "processing" | "processed" | "ignored" | "failed";
          attempts?: number;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          legal_name: string;
          country_code: "CA" | "US";
          currency_code: "CAD" | "USD";
          contact_email: string;
          support_email: string;
          fulfillment_method: "portal" | "email" | "api";
          api_base_url: string | null;
          stripe_connected_account_id: string | null;
          production_min_days: number;
          production_max_days: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string;
          country_code: "CA" | "US";
          currency_code: "CAD" | "USD";
          contact_email: string;
          support_email?: string;
          fulfillment_method: "portal" | "email" | "api";
          api_base_url?: string | null;
          stripe_connected_account_id?: string | null;
          production_min_days?: number;
          production_max_days?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          legal_name?: string;
          country_code?: "CA" | "US";
          currency_code?: "CAD" | "USD";
          contact_email?: string;
          support_email?: string;
          fulfillment_method?: "portal" | "email" | "api";
          api_base_url?: string | null;
          stripe_connected_account_id?: string | null;
          production_min_days?: number;
          production_max_days?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_users: {
        Row: {
          id: string;
          supplier_id: string;
          user_id: string;
          role: "owner" | "manager" | "operator" | "viewer";
          status: "active" | "invited" | "disabled";
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          user_id: string;
          role: "owner" | "manager" | "operator" | "viewer";
          status?: "active" | "invited" | "disabled";
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          user_id?: string;
          role?: "owner" | "manager" | "operator" | "viewer";
          status?: "active" | "invited" | "disabled";
          created_at?: string;
        };
        Relationships: [];
      };
      supplier_products: {
        Row: {
          id: string;
          supplier_id: string;
          product_variant_id: string;
          supplier_sku: string;
          manufacturing_cost_cents: number;
          setup_cost_cents: number;
          supplier_currency_code: "CAD" | "USD";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          product_variant_id: string;
          supplier_sku: string;
          manufacturing_cost_cents: number;
          setup_cost_cents?: number;
          supplier_currency_code: "CAD" | "USD";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          product_variant_id?: string;
          supplier_sku?: string;
          manufacturing_cost_cents?: number;
          setup_cost_cents?: number;
          supplier_currency_code?: "CAD" | "USD";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_shipping_rates: {
        Row: {
          id: string;
          supplier_id: string;
          shipping_zone_id: string;
          supplier_product_id: string | null;
          shipping_method_name: string;
          supplier_cost_cents: number;
          customer_charge_cents: number;
          estimated_min_days: number;
          estimated_max_days: number;
          active: boolean;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          shipping_zone_id: string;
          supplier_product_id?: string | null;
          shipping_method_name: string;
          supplier_cost_cents: number;
          customer_charge_cents: number;
          estimated_min_days?: number;
          estimated_max_days?: number;
          active?: boolean;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          shipping_zone_id?: string;
          supplier_product_id?: string | null;
          shipping_method_name?: string;
          supplier_cost_cents?: number;
          customer_charge_cents?: number;
          estimated_min_days?: number;
          estimated_max_days?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      fulfillments: {
        Row: {
          id: string;
          order_id: string;
          supplier_id: string;
          parent_fulfillment_id: string | null;
          status:
            | "pending_submission"
            | "submission_failed"
            | "submitted"
            | "accepted"
            | "rejected"
            | "in_production"
            | "ready_to_ship"
            | "shipped"
            | "completed"
            | "cancelled"
            | "remake_requested"
            | "remake_in_progress";
          supplier_order_reference: string | null;
          submission_idempotency_key: string;
          manufacturing_cost_cents: number;
          supplier_shipping_cost_cents: number;
          supplier_payment_status: "unpaid" | "pending" | "paid" | "waived";
          destination_country_code: "CA" | "US" | null;
          customer_snapshot: Json;
          production_personalization: Json;
          rejection_reason: string;
          remake_reason: string;
          submitted_at: string | null;
          accepted_at: string | null;
          production_started_at: string | null;
          shipped_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          supplier_id: string;
          parent_fulfillment_id?: string | null;
          status?:
            | "pending_submission"
            | "submission_failed"
            | "submitted"
            | "accepted"
            | "rejected"
            | "in_production"
            | "ready_to_ship"
            | "shipped"
            | "completed"
            | "cancelled"
            | "remake_requested"
            | "remake_in_progress";
          supplier_order_reference?: string | null;
          submission_idempotency_key: string;
          manufacturing_cost_cents?: number;
          supplier_shipping_cost_cents?: number;
          supplier_payment_status?: "unpaid" | "pending" | "paid" | "waived";
          destination_country_code?: "CA" | "US" | null;
          customer_snapshot?: Json;
          production_personalization?: Json;
          rejection_reason?: string;
          remake_reason?: string;
          submitted_at?: string | null;
          accepted_at?: string | null;
          production_started_at?: string | null;
          shipped_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          supplier_id?: string;
          parent_fulfillment_id?: string | null;
          status?:
            | "pending_submission"
            | "submission_failed"
            | "submitted"
            | "accepted"
            | "rejected"
            | "in_production"
            | "ready_to_ship"
            | "shipped"
            | "completed"
            | "cancelled"
            | "remake_requested"
            | "remake_in_progress";
          supplier_order_reference?: string | null;
          submission_idempotency_key?: string;
          manufacturing_cost_cents?: number;
          supplier_shipping_cost_cents?: number;
          supplier_payment_status?: "unpaid" | "pending" | "paid" | "waived";
          destination_country_code?: "CA" | "US" | null;
          customer_snapshot?: Json;
          production_personalization?: Json;
          rejection_reason?: string;
          remake_reason?: string;
          submitted_at?: string | null;
          accepted_at?: string | null;
          production_started_at?: string | null;
          shipped_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fulfillment_items: {
        Row: {
          id: string;
          fulfillment_id: string;
          order_item_id: string;
          supplier_product_id: string;
          artwork_storage_path: string | null;
          production_notes: string;
          personalization_record: Json;
          status: "pending" | "artwork_ready" | "in_production" | "completed" | "remake";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fulfillment_id: string;
          order_item_id: string;
          supplier_product_id: string;
          artwork_storage_path?: string | null;
          production_notes?: string;
          personalization_record?: Json;
          status?: "pending" | "artwork_ready" | "in_production" | "completed" | "remake";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fulfillment_id?: string;
          order_item_id?: string;
          supplier_product_id?: string;
          artwork_storage_path?: string | null;
          production_notes?: string;
          personalization_record?: Json;
          status?: "pending" | "artwork_ready" | "in_production" | "completed" | "remake";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          fulfillment_id: string;
          carrier: string;
          service: string;
          tracking_number: string;
          tracking_url: string;
          shipped_at: string;
          estimated_delivery_at: string | null;
          delivered_at: string | null;
          status: "pending" | "shipped" | "in_transit" | "delivered" | "exception";
          tracking_email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fulfillment_id: string;
          carrier: string;
          service?: string;
          tracking_number: string;
          tracking_url?: string;
          shipped_at?: string;
          estimated_delivery_at?: string | null;
          delivered_at?: string | null;
          status?: "pending" | "shipped" | "in_transit" | "delivered" | "exception";
          tracking_email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fulfillment_id?: string;
          carrier?: string;
          service?: string;
          tracking_number?: string;
          tracking_url?: string;
          shipped_at?: string;
          estimated_delivery_at?: string | null;
          delivered_at?: string | null;
          status?: "pending" | "shipped" | "in_transit" | "delivered" | "exception";
          tracking_email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_invoices: {
        Row: {
          id: string;
          supplier_id: string;
          fulfillment_id: string;
          invoice_number: string;
          amount_cents: number;
          currency_code: "CAD" | "USD";
          status: "draft" | "issued" | "paid" | "void";
          due_at: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          fulfillment_id: string;
          invoice_number: string;
          amount_cents: number;
          currency_code: "CAD" | "USD";
          status?: "draft" | "issued" | "paid" | "void";
          due_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          fulfillment_id?: string;
          invoice_number?: string;
          amount_cents?: number;
          currency_code?: "CAD" | "USD";
          status?: "draft" | "issued" | "paid" | "void";
          due_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      fulfillment_audit_log: {
        Row: {
          id: string;
          fulfillment_id: string | null;
          supplier_id: string | null;
          order_id: string | null;
          actor_user_id: string | null;
          action: string;
          summary: string;
          before_state: Json;
          after_state: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          fulfillment_id?: string | null;
          supplier_id?: string | null;
          order_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          summary: string;
          before_state?: Json;
          after_state?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          fulfillment_id?: string | null;
          supplier_id?: string | null;
          order_id?: string | null;
          actor_user_id?: string | null;
          action?: string;
          summary?: string;
          before_state?: Json;
          after_state?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_events: {
        Row: {
          id: string;
          event_type: string;
          aggregate_type: string;
          aggregate_id: string;
          payload: Json;
          status: "queued" | "processing" | "sent" | "failed" | "cancelled" | "skipped";
          available_at: string;
          processed_at: string | null;
          attempts: number;
          last_error: string | null;
          dedupe_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          aggregate_type: string;
          aggregate_id: string;
          payload?: Json;
          status?: "queued" | "processing" | "sent" | "failed" | "cancelled" | "skipped";
          available_at?: string;
          processed_at?: string | null;
          attempts?: number;
          last_error?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          aggregate_type?: string;
          aggregate_id?: string;
          payload?: Json;
          status?: "queued" | "processing" | "sent" | "failed" | "cancelled" | "skipped";
          available_at?: string;
          processed_at?: string | null;
          attempts?: number;
          last_error?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          id: string;
          key: string;
          name: string;
          subject_template: string;
          category: "transactional" | "operational" | "marketing";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          subject_template: string;
          category: "transactional" | "operational" | "marketing";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          subject_template?: string;
          category?: "transactional" | "operational" | "marketing";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          id: string;
          notification_event_id: string;
          user_id: string | null;
          recipient_email: string;
          template_key: string;
          provider_message_id: string | null;
          status:
            | "queued"
            | "sent"
            | "delivered"
            | "opened"
            | "clicked"
            | "bounced"
            | "complained"
            | "failed"
            | "skipped";
          dedupe_key: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          bounced_at: string | null;
          complained_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_event_id: string;
          user_id?: string | null;
          recipient_email: string;
          template_key: string;
          provider_message_id?: string | null;
          status?:
            | "queued"
            | "sent"
            | "delivered"
            | "opened"
            | "clicked"
            | "bounced"
            | "complained"
            | "failed"
            | "skipped";
          dedupe_key?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notification_event_id?: string;
          user_id?: string | null;
          recipient_email?: string;
          template_key?: string;
          provider_message_id?: string | null;
          status?:
            | "queued"
            | "sent"
            | "delivered"
            | "opened"
            | "clicked"
            | "bounced"
            | "complained"
            | "failed"
            | "skipped";
          dedupe_key?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          campaign_updates: boolean;
          business_updates: boolean;
          order_updates: boolean;
          marketing_emails: boolean;
          winner_sales_emails: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_updates?: boolean;
          business_updates?: boolean;
          order_updates?: boolean;
          marketing_emails?: boolean;
          winner_sales_emails?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_updates?: boolean;
          business_updates?: boolean;
          order_updates?: boolean;
          marketing_emails?: boolean;
          winner_sales_emails?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_has_platform_role: {
        Args: { role_keys: string[] };
        Returns: boolean;
      };
      grant_platform_role: {
        Args: { target_user_id: string; role_key: string };
        Returns: undefined;
      };
      revoke_platform_role: {
        Args: { target_user_id: string; role_key: string };
        Returns: undefined;
      };
      is_campaign_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_business_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      normalize_business_text: {
        Args: { input: string };
        Returns: string;
      };
      normalize_phone_digits: {
        Args: { input: string };
        Returns: string;
      };
      normalize_website_domain: {
        Args: { input: string };
        Returns: string;
      };
      record_campaign_audit: {
        Args: {
          p_community_id: string;
          p_campaign_id: string;
          p_entity_type: string;
          p_entity_id: string;
          p_action: string;
          p_summary: string;
          p_before?: Json;
          p_after?: Json;
        };
        Returns: undefined;
      };
      has_active_business_membership: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
      business_member_role: {
        Args: { p_business_id: string };
        Returns: string;
      };
      can_manage_business_profile: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
      record_business_claim_status_change: {
        Args: {
          p_claim_id: string;
          p_from_status: string;
          p_to_status: string;
          p_notes?: string;
        };
        Returns: undefined;
      };
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      has_active_supplier_membership: {
        Args: { p_supplier_id: string };
        Returns: boolean;
      };
      is_supplier_member: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type { TimestampFields };
