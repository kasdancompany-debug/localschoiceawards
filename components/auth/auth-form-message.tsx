import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AuthFormMessageProps = {
  tone?: "error" | "success" | "info";
  title?: string;
  message?: string;
};

export function AuthFormMessage({ tone = "info", title, message }: AuthFormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant={tone === "error" ? "destructive" : "default"}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
