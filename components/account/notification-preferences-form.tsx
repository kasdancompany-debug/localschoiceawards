"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateNotificationPreferencesAction,
  type NotificationPrefsActionState,
} from "@/lib/notifications/preference-actions";
import type { NotificationPreferences } from "@/types/notifications";

const initialState: NotificationPrefsActionState = { ok: false };

type NotificationPreferencesFormProps = {
  preferences: NotificationPreferences;
};

function ToggleRow(props: {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <Label htmlFor={props.id}>{props.label}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
      </div>
      <input
        id={props.id}
        name={props.name}
        type="checkbox"
        defaultChecked={props.defaultChecked}
        className="mt-1 size-4 accent-primary"
      />
    </div>
  );
}

export function NotificationPreferencesForm({ preferences }: NotificationPreferencesFormProps) {
  const [state, action, pending] = useActionState(updateNotificationPreferencesAction, initialState);

  return (
    <div className="space-y-4">
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "Saved" : state.message ? "Update problem" : undefined}
        message={state.message}
      />
      <form action={action} className="space-y-2">
        <ToggleRow
          id="pref-campaign"
          name="campaignUpdates"
          label="Campaign updates"
          description="Nominations, voting windows, and results announcements."
          defaultChecked={preferences.campaignUpdates}
        />
        <ToggleRow
          id="pref-business"
          name="businessUpdates"
          label="Business updates"
          description="Claim status and business profile operational messages."
          defaultChecked={preferences.businessUpdates}
        />
        <ToggleRow
          id="pref-order"
          name="orderUpdates"
          label="Optional order tips"
          description="Non-essential order tips. Required transactional receipts and shipping notices cannot be disabled."
          defaultChecked={preferences.orderUpdates}
        />
        <ToggleRow
          id="pref-marketing"
          name="marketingEmails"
          label="Marketing emails"
          description="Cart reminders and promotional campaigns. Separate from operational messages."
          defaultChecked={preferences.marketingEmails}
        />
        <ToggleRow
          id="pref-winner-sales"
          name="winnerSalesEmails"
          label="Winner recognition product emails"
          description="Timed follow-ups after a win. Requires marketing consent and stops when you place an order."
          defaultChecked={preferences.winnerSalesEmails}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save email preferences"}
        </Button>
      </form>
    </div>
  );
}
