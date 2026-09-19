import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
      appearance={{
        variables: {
          colorPrimary: "#2563eb",
          colorText: "#0f172a",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "shadow-none border border-border rounded-lg",
          headerTitle: "text-xl font-semibold tracking-tight text-foreground",
          headerSubtitle: "text-sm text-muted-foreground",
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none",
          footerActionLink: "text-primary font-medium",
        },
      }}
    />
  );
}